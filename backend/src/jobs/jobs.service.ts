import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus, UserRole } from '@prisma/client';
import { calculateDistance } from '../common/utils/geo.utils';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class JobsService {
  private readonly GEOFENCE_RADIUS = 150; // meters

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) { }

  async createJob(dto: any, creatorId: string) {
    return this.prisma.job.create({
      data: {
        ...dto,
        status: JobStatus.POSTED,
        createdBy: creatorId,
      },
    });
  }

  async acceptJob(jobId: string, workerId: string) {
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true, wallet: true },
    });

    const workerProfile = worker?.workerProfile;

    if (!worker || !workerProfile || !workerProfile.profileCompleted) {
      throw new BadRequestException(
        'Complete your profile before accepting jobs',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.status !== JobStatus.POSTED) {
        throw new BadRequestException('Job is no longer available');
      }

      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.ACCEPTED,
          workerId: workerProfile.id,
          acceptedAt: new Date(),
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: JobStatus.ACCEPTED,
          changedBy: workerId,
          reason: 'Job accepted by worker',
        },
      });

      return updatedJob;
    });
  }

  async recordArrival(jobId: string, userId: string, lat: number, lng: number) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job || job.worker?.userId !== userId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    if (job.status !== JobStatus.ACCEPTED) {
      throw new BadRequestException('Invalid job status for arrival');
    }

    const distance = calculateDistance(
      lat,
      lng,
      Number(job.locationLat),
      Number(job.locationLng),
    );

    if (distance > this.GEOFENCE_RADIUS) {
      throw new BadRequestException(
        `You are too far from the job location (${Math.round(distance)}m). Distance required: ${this.GEOFENCE_RADIUS}m`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.ARRIVED,
          arrivedAt: now,
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: JobStatus.ARRIVED,
          changedBy: userId,
          reason: `Worker arrived at location (accuracy: ${Math.round(distance)}m)`,
          metadata: { lat, lng, distanceMeters: distance },
        },
      });

      // Performance Tracking
      const workerId = job.workerId!;
      await tx.workerPerformance.upsert({
        where: { workerId: workerId },
        create: {
          workerId: workerId,
          totalJobs: 1,
          onTimeArrivals: 1, // For now simple increment
        },
        update: {
          totalJobs: { increment: 1 },
          onTimeArrivals: { increment: 1 },
        },
      });

      return updatedJob;
    });
  }

  async submitProof(jobId: string, userId: string, proofs: any[]) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job || job.worker?.userId !== userId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.jobProof.createMany({
        data: proofs.map((p) => ({
          jobId,
          ...p,
        })),
      });

      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.PROOF_SUBMITTED },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: JobStatus.PROOF_SUBMITTED,
          changedBy: userId,
          reason: 'Proofs submitted for approval',
        },
      });

      return updatedJob;
    });
  }

  async rateJob(
    jobId: string,
    userId: string,
    score: number,
    comment?: string,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job || job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed jobs');
    }

    if (job.createdBy !== userId) {
      throw new ForbiddenException('Only the job creator can leave a rating');
    }

    return this.prisma.$transaction(async (tx) => {
      const rating = await tx.rating.create({
        data: {
          jobId,
          giverId: userId,
          receiverId: job.worker!.userId,
          workerId: job.worker!.id,
          score,
          comment,
        },
      });

      // Update worker average rating
      const ratings = await tx.rating.findMany({
        where: { workerId: job.worker!.id },
      });
      const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

      await tx.workerProfile.update({
        where: { id: job.worker!.id },
        data: { rating: avg, totalJobs: { increment: 1 } },
      });

      return rating;
    });
  }

  async getAvailableJobs(filters: any) {
    const { district, serviceId, minPrice, maxPrice } = filters;
    return this.prisma.job.findMany({
      where: {
        status: JobStatus.POSTED,
        district,
        serviceId,
        priceCents: {
          gte: minPrice,
          lte: maxPrice,
        },
      },
      include: { service: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async decideProof(
    jobId: string,
    adminId: string,
    decision: 'APPROVE' | 'REJECT',
    reason?: string,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== JobStatus.PROOF_SUBMITTED) {
      throw new BadRequestException('Job is not pending proof approval');
    }

    return this.prisma.$transaction(async (tx) => {
      let newStatus: JobStatus;

      if (decision === 'APPROVE') {
        newStatus = JobStatus.APPROVED;
      } else {
        newStatus = JobStatus.ARRIVED; // Revert to ARRIVED so they can resubmit proof
      }

      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          rejectionReason: decision === 'REJECT' ? reason : null,
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: newStatus,
          changedBy: adminId,
          reason: reason || `Proof ${decision.toLowerCase()}d`,
        },
      });

      return updatedJob;
    });
  }
  async findAll(filters: any) {
    const { page = 1, limit = 20, status, q } = filters;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { creator: { fullName: { contains: q, mode: 'insensitive' } } },
        { worker: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { fullName: true, email: true } },
          worker: { include: { user: { select: { fullName: true, email: true } } } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: { total, page, limit, totalPages: Math.ceil(total / Number(limit)) },
    };
  }
}
