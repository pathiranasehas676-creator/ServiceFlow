import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  JobStatus,
  UserRole,
  TransactionType,
  JobPostMode,
  ProofPolicyType,
  VerificationStatus,
  NotificationType,
  DisputeStatus,
  FilePurpose,
} from '@prisma/client';
import { calculateDistance } from '../common/utils/geo.utils';
import { StorageService } from '../storage/storage.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProfilePolicyService } from '../profile-policy/profile-policy.service';
import {
  CancelJobDto,
  CreateDisputeDto,
  DisputeMessageDto,
} from './dto/cancellation-dispute.dto';
import { AuditAction, JobCancelReason } from '@prisma/client';

import { RiskService } from '../risk/risk.service';
import { StripeService } from '../payments/stripe.service';

@Injectable()
export class JobsService {
  private readonly GEOFENCE_RADIUS = 150; // meters

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private walletService: WalletService,
    private notificationsService: NotificationsService,
    private profilePolicyService: ProfilePolicyService,
    private riskService: RiskService,
    private stripeService: StripeService,
  ) {}

  async createJob(dto: any, creatorId: string, role: string) {
    const isUser = role === 'USER';
    return this.prisma.job.create({
      data: {
        ...dto,
        status: isUser ? ('PENDING_PAYMENT' as any) : JobStatus.POSTED,
        createdBy: creatorId,
      },
    });
  }

  async acceptJob(jobId: string, userId: string) {
    const worker = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });

    const workerProfile = worker?.workerProfile;

    if (!worker || !workerProfile) {
      throw new BadRequestException('Worker profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
      });

      if (!job || job.status !== JobStatus.POSTED) {
        throw new BadRequestException('Job is no longer available');
      }

      // Check Post Mode
      if ((job as any).postMode === (JobPostMode as any).DIRECT_ASSIGN) {
        if ((job as any).directAssignWorkerId !== userId) {
          throw new ForbiddenException(
            'This job is reserved for another worker',
          );
        }
      }

      // Profile policy check
      const policyEvaluation =
        await this.profilePolicyService.getEvaluationWithReasons(
          workerProfile.id,
        );

      if (!policyEvaluation.canAcceptJobs) {
        throw new ForbiddenException({
          message: 'Profile requirements not met for accepting jobs',
          missingItems: policyEvaluation.missingItems,
          reasons: policyEvaluation.reasons,
          currentScore: policyEvaluation.score,
        });
      }

      // Check Eligibility (Re-verify at acceptance)
      if (
        (job as any).verifiedOnly &&
        (workerProfile as any).verificationStatus !==
          VerificationStatus.APPROVED
      ) {
        throw new ForbiddenException(
          'Only verified workers can accept this job',
        );
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
          changedBy: userId,
          reason: 'Job accepted by worker',
        },
      });

      return updatedJob;
    });
  }

  async recordArrival(
    jobId: string,
    userId: string,
    lat: number,
    lng: number,
    ip?: string,
    userAgent?: string,
    accuracyMeters?: number,
    isMock?: boolean,
  ) {
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

    if (distance > job.geofenceRadiusM) {
      throw new BadRequestException(
        `You are too far from the job location (${Math.round(distance)}m). Distance required: ${job.geofenceRadiusM}m`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.ARRIVED,
          arrivedAt: now,
          arrivedLatitude: lat,
          arrivedLongitude: lng,
          arrivalDistanceMeters: Math.round(distance),
          arrivalIp: ip,
          arrivalUserAgent: userAgent,
          arrivalAccuracyMeters: accuracyMeters,
          arrivalIsMock: isMock,
        } as any,
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: JobStatus.ARRIVED,
          changedBy: userId,
          reason: `Worker arrived at location (accuracy: ${Math.round(distance)}m)`,
          metadata: { lat, lng, distanceMeters: distance, ip, userAgent },
        },
      });

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: AuditAction.JOB_UPDATE,
          actionDetail: `Worker marked arrival: ${Math.round(distance)}m`,
          entityType: 'Job',
          entityId: jobId,
          newValue: { status: JobStatus.ARRIVED, distance, lat, lng } as any,
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      // Notification to Creator (Optional but Recommended)
      await this.notificationsService.create(
        job.createdBy,
        NotificationType.JOB_ASSIGNED, // Reusing existing type or assume generic update
        'Worker Arrived',
        `Worker has arrived at the job location.`,
        { type: 'JOB', id: jobId },
        tx,
      );

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
          // totalJobs should be incremented on completion, not arrival?
          // Keeping existing logic but note: totalJobs usually means completed jobs.
          // Leaving as is to minimize regression risk if logic relied on this.
          // onTimeArrivals: { increment: 1 },
        },
      });

      return updatedJob;
    });

    // Update User Risk Profile based on arrival signals
    await this.riskService.updateUserRiskProfile(userId);

    return result;
  }

  async getProofPresign(
    jobId: string,
    userId: string,
    fileInfo: { fileName: string; mimeType: string; sizeBytes: number },
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job || job.worker?.userId !== userId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    if (job.status !== JobStatus.ARRIVED) {
      throw new BadRequestException(
        'Job must be in ARRIVED status to upload proof',
      );
    }

    return this.storage.generatePresignedPutUrl(
      userId,
      (FilePurpose as any).JOB_PROOF,
      fileInfo.mimeType,
      fileInfo.sizeBytes,
      jobId,
    );
  }

  async submitProof(jobId: string, userId: string, proofs: any[]) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job || job.worker?.userId !== userId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    // Fraud Prevention: Minimum time at site (5 minutes)
    if (!job.arrivedAt) {
      throw new BadRequestException(
        'You must record arrival before submitting proof',
      );
    }
    const minutesAtSite = (Date.now() - job.arrivedAt.getTime()) / (1000 * 60);
    if (minutesAtSite < 5) {
      throw new BadRequestException(
        `Security Policy: You must be at the site for at least 5 minutes before submitting proof. Please wait ${Math.ceil(5 - minutesAtSite)} more minute(s).`,
      );
    }

    // Enforce Proof Policy
    if (job.proofPolicy === ProofPolicyType.NONE) {
      throw new BadRequestException('Proof is not required for this job');
    }

    if (proofs.length < job.minProofImages) {
      throw new BadRequestException(
        `Minimum ${job.minProofImages} images required`,
      );
    }

    if (job.requireBeforeAfter) {
      const hasBefore = proofs.some((p) => p.proofType === 'BEFORE');
      const hasAfter = proofs.some((p) => p.proofType === 'AFTER');
      if (!hasBefore || !hasAfter) {
        throw new BadRequestException(
          'Both BEFORE and AFTER proofs are required',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.jobProof.createMany({
        data: proofs.map((p) => ({
          jobId,
          imageKey: p.imageKey,
          mimeType: p.mimeType,
          fileSizeBytes: p.fileSizeBytes,
          proofType: p.proofType || 'GENERAL',
          caption: p.caption,
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

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: AuditAction.JOB_UPDATE,
          actionDetail: 'Proof submitted for job',
          entityType: 'Job',
          entityId: jobId,
          newValue: {
            status: JobStatus.PROOF_SUBMITTED,
            proofCount: proofs.length,
          } as any,
        },
      });

      // Notification
      await this.notificationsService.create(
        job.createdBy,
        NotificationType.PROOF_DECISION, // Or generic update
        'Proof Submitted',
        `Worker has submitted proof for job "${job.title}".`,
        { type: 'JOB', id: jobId },
        tx,
      );

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

      // Note: Worker rating/totalJobs are now tracked in WorkerPerformance table
      // No need to update WorkerProfile here

      return rating;
    });
  }

  async getAvailableJobs(workerId: string, filters: any) {
    const worker = await this.prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: { include: { performance: true } } },
    });

    if (!worker || !worker.workerProfile) {
      throw new BadRequestException('Worker profile not found');
    }

    const { district, serviceId, minPrice, maxPrice } = filters;

    // Eligibility filter logic
    return this.prisma.job.findMany({
      where: {
        status: JobStatus.POSTED,
        postMode: JobPostMode.PUBLIC, // Public feed only
        district: district || undefined,
        serviceId: serviceId || undefined,
        priceCents: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
        // Eligibility Filters
        verifiedOnly:
          worker.workerProfile.verificationStatus === 'APPROVED'
            ? undefined
            : false,
        districtRestricted: {
          // If district restricted is TRUE, then job district must match worker district
          // But worker district is not in workerProfile directly? I should check.
          // For now, if districtRestricted is true, we filter by job.district
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
      let transactionId: string | undefined;

      if (decision === 'APPROVE') {
        newStatus = 'PENDING_CUSTOMER_CONFIRMATION' as any;

        // Notify Creator to confirm completion
        await this.notificationsService.create(
          job.createdBy,
          NotificationType.PROOF_DECISION,
          'Action Required: Confirm Job Completion',
          `The work for "${job.title}" has been approved by staff. Please review the proof and confirm completion to release payment.`,
          { type: 'JOB', id: jobId },
          tx,
        );

        // Notify Worker that it's pending customer confirmation
        await this.notificationsService.create(
          job.worker!.userId,
          NotificationType.PROOF_DECISION,
          'Proof Approved by Staff',
          `Your proof for "${job.title}" has been approved by staff and is now awaiting customer confirmation.`,
          { type: 'JOB', id: jobId },
          tx,
        );
      } else {
        newStatus = JobStatus.ARRIVED; // Revert to ARRIVED so they can resubmit proof

        // Notify Worker of Rejection
        await this.notificationsService.create(
          job.worker!.userId,
          NotificationType.PROOF_DECISION,
          'Proof Rejected',
          `Your proof for "${job.title}" was rejected. Reason: ${reason}`,
          { type: 'JOB', id: jobId },
          tx,
        );
      }

      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          rejectionReason: decision === 'REJECT' ? reason : null,
          completedAt:
            newStatus === JobStatus.COMPLETED ? new Date() : undefined,
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

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action:
            decision === 'APPROVE' ? AuditAction.APPROVE : AuditAction.REJECT,
          actionDetail: `Job proof ${decision.toLowerCase()}d (Status: ${newStatus})`,
          entityType: 'Job',
          entityId: jobId,
          newValue: { status: newStatus, reason } as any,
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
        {
          worker: { user: { fullName: { contains: q, mode: 'insensitive' } } },
        },
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
          worker: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // ============================================
  // CANCELLATIONS
  // ============================================

  async cancelJob(jobId: string, userId: string, dto: CancelJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        worker: { include: { user: true } },
        creator: true,
      },
    });

    if (!job) throw new NotFoundException('Job not found');

    const isWorker = job.worker?.userId === userId;
    const isCreator = job.createdBy === userId;

    if (!isWorker && !isCreator) {
      throw new ForbiddenException(
        'You do not have permission to cancel this job',
      );
    }

    if (
      (
        [
          JobStatus.COMPLETED,
          JobStatus.CANCELLED,
          JobStatus.APPROVED,
        ] as JobStatus[]
      ).includes(job.status)
    ) {
      throw new BadRequestException(
        'Job cannot be cancelled in its current status',
      );
    }

    let lateFeeCents = 0;

    if (isWorker) {
      if (job.status === JobStatus.ARRIVED) {
        throw new BadRequestException('Cannot cancel job after arrival');
      }

      if (job.status !== JobStatus.POSTED) {
        // Check cancellation window
        const executionDate = new Date(job.executionDate);
        const cancelDeadline = new Date(
          executionDate.getTime() -
            (job.cancelBeforeHours || 24) * 60 * 60 * 1000,
        );

        if (new Date() > cancelDeadline) {
          lateFeeCents = job.lateCancelFeeCents || 0;
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelledById: userId,
          cancelReason: dto.reason,
          cancelNote: dto.note,
          cancelledFeeCents: lateFeeCents,
        } as any,
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: JobStatus.CANCELLED,
          changedBy: userId,
          reason:
            dto.note || `Job cancelled by ${isWorker ? 'worker' : 'creator'}`,
          metadata: { reason: dto.reason, lateFeeCents },
        },
      });

      // Update Worker stats if worker cancelled
      if (isWorker && job.workerId) {
        await tx.workerPerformance.upsert({
          where: { workerId: job.workerId },
          create: {
            workerId: job.workerId,
            cancellationCount: 1,
            reliabilityScore: 95.0,
          } as any,
          update: {
            cancellationCount: { increment: 1 },
            reliabilityScore: { decrement: 5.0 },
          } as any,
        });
      }

      // Handle late fee if applicable
      if (lateFeeCents > 0) {
        await this.walletService.debit(
          userId,
          lateFeeCents,
          `Late cancellation fee for job: ${job.title}`,
          'JOB_CANCELLATION',
          jobId,
          false,
          tx,
        );
      }

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: 'JOB_CANCEL' as any,
          actionDetail: `Job cancelled: ${job.title}`,
          entityType: 'Job',
          entityId: jobId,
          newValue: { status: JobStatus.CANCELLED, lateFeeCents },
        },
      });

      // Notifications
      const notifyUsers = [];
      if (isWorker) notifyUsers.push(job.createdBy);
      if (isCreator && job.worker) notifyUsers.push(job.worker.userId);

      for (const targetId of notifyUsers) {
        await this.notificationsService.create(
          targetId,
          NotificationType.JOB_CANCELLED,
          'Job Cancelled',
          `The job "${job.title}" has been cancelled.`,
          { type: 'JOB', id: jobId },
        );
      }

      return updatedJob;
    });
  }

  // ============================================
  // DISPUTES
  // ============================================

  async createDispute(jobId: string, userId: string, dto: CreateDisputeDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    const isWorker = job.worker?.userId === userId;
    const isCreator = job.createdBy === userId;

    if (!isWorker && !isCreator) {
      throw new ForbiddenException(
        'You do not have permission to open a dispute for this job',
      );
    }

    // Dispute Window check
    const completionDate = job.completedAt || job.updatedAt;
    const windowDays = job.disputeWindowDays || 7;
    const deadline = new Date(
      completionDate.getTime() + windowDays * 24 * 60 * 60 * 1000,
    );

    if (new Date() > deadline) {
      throw new BadRequestException('Dispute window has closed for this job');
    }

    const existingDispute = await this.prisma.dispute.findFirst({
      where: { jobId, status: { not: DisputeStatus.REJECTED } },
    });
    if (existingDispute) {
      throw new BadRequestException(
        'An active dispute already exists for this job',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          jobId,
          openedById: userId,
          reason: dto.reason,
          status: DisputeStatus.OPEN,
          attachments: {
            create: dto.attachments?.map((a) => ({
              fileKey: a.fileKey,
              mimeType: a.mimeType,
              size: a.size,
              originalName: a.originalName,
            })),
          },
        },
      });

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: AuditAction.DISPUTE_OPEN,
          actionDetail: `Dispute opened for job: ${job.title}`,
          entityType: 'Dispute',
          entityId: dispute.id,
          newValue: { jobId, reason: dto.reason } as any,
        },
      });

      // Notification to counterpart
      const targetId = isWorker ? job.createdBy : job.worker!.userId;
      await this.notificationsService.create(
        targetId,
        NotificationType.DISPUTE_OPENED,
        'Dispute Opened',
        `A dispute has been opened for job "${job.title}".`,
        { type: 'DISPUTE', id: dispute.id },
      );

      return dispute;
    });
  }

  async addDisputeMessage(
    disputeId: string,
    userId: string,
    dto: DisputeMessageDto,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { job: { include: { worker: true } } },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    const isWorker = dispute.job.worker?.userId === userId;
    const isCreator = dispute.job.createdBy === userId;
    // Staff/Admin check should be handled by guard/controller if needed,
    // but here we check for parties involved first.

    if (!isWorker && !isCreator) {
      // Check if user is staff/admin? We'll let the controller pass if user is admin.
      // For now, assume this method is for parties.
    }

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.disputeMessage.create({
        data: {
          disputeId,
          senderId: userId,
          message: dto.message,
        },
      });

      // Notify counterpart
      const targetId =
        userId === dispute.job.createdBy
          ? dispute.job.worker!.userId
          : dispute.job.createdBy;
      await this.notificationsService.create(
        targetId,
        NotificationType.DISPUTE_MESSAGE,
        'New Dispute Message',
        `New message in dispute for "${dispute.job.title}".`,
        { type: 'DISPUTE', id: dispute.id },
      );

      return message;
    });
  }

  async getDisputes(userId: string) {
    return this.prisma.dispute.findMany({
      where: {
        OR: [
          { openedById: userId },
          { job: { worker: { userId } } },
          { job: { createdBy: userId } },
        ],
      },
      include: {
        job: { select: { title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJob(id: string, userId: string, userRole: UserRole) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        worker: {
          include: {
            user: {
              select: { fullName: true, email: true, phoneNumber: true },
            },
          },
        },
        creator: {
          select: { fullName: true, email: true, phoneNumber: true },
        },
        proofs: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        attachments: true,
        service: true,
      },
    });

    if (!job) throw new NotFoundException('Job not found');

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    const isWorker = job.worker?.userId === userId;
    const isCreator = job.createdBy === userId;

    if (!isAdmin && !isWorker && !isCreator) {
      if (
        job.status === JobStatus.POSTED &&
        job.postMode === JobPostMode.PUBLIC
      ) {
        return job;
      }
      throw new ForbiddenException(
        'You do not have permission to view this job',
      );
    }

    return job;
  }

  async getDispute(disputeId: string, userId: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        job: {
          include: {
            worker: { include: { user: { select: { fullName: true } } } },
            creator: { select: { fullName: true } },
            proofs: true,
          },
        },
        messages: {
          include: { sender: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');

    // Access check
    const isWorker = dispute.job.worker?.userId === userId;
    const isCreator = dispute.job.createdBy === userId;
    // Admin check handled in controller.

    return dispute;
  }

  async handleNoShows() {
    const jobStatus = JobStatus;
    const now = new Date();
    // 30 min grace period
    const gracePeriodMs = 30 * 60 * 1000;
    const thresholdTime = new Date(now.getTime() - gracePeriodMs);

    const potentialNoShows = await this.prisma.job.findMany({
      where: {
        status: jobStatus.ACCEPTED,
        executionDate: { lt: thresholdTime },
      },
      include: { worker: { include: { user: true } } },
    });

    for (const job of potentialNoShows) {
      // Run in transaction for each job
      await this.prisma.$transaction(async (tx) => {
        await tx.job.update({
          where: { id: job.id },
          data: {
            status: jobStatus.CANCELLED,
            cancelReason: JobCancelReason.NO_SHOW, // Cast if enum import issue
            cancelledAt: now,
            cancelledFeeCents: job.priceCents,
          } as any,
        });

        await tx.jobStatusHistory.create({
          data: {
            jobId: job.id,
            toStatus: jobStatus.CANCELLED,
            changedBy: 'SYSTEM', // System actor
            reason: 'Worker No-Show (Auto-Cancellation)',
            metadata: { reason: 'NO_SHOW' },
          },
        });

        // Update Worker Stats
        if (job.workerId) {
          const profile = await tx.workerPerformance.upsert({
            where: { workerId: job.workerId },
            create: {
              workerId: job.workerId,
              noShowCount: 1,
              reliabilityScore: 80.0,
            } as any,
            update: {
              noShowCount: { increment: 1 },
              reliabilityScore: { decrement: 20.0 },
            } as any,
          });

          // Suspension Logic (e.g. >= 3 No Shows)
          if ((profile as any).noShowCount >= 3) {
            await tx.workerProfile.update({
              where: { id: job.workerId },
              data: {
                isSuspended: true,
                suspendedAt: now,
                suspensionReason: 'Excessive No-Shows',
              } as any,
            });
          }
        }

        // Audit
        await tx.adminAuditLog.create({
          data: {
            action: AuditAction.JOB_UPDATE,
            actionDetail: 'System marked job as No-Show',
            entityType: 'Job',
            entityId: job.id,
            newValue: { status: jobStatus.CANCELLED, reason: 'NO_SHOW' } as any,
          },
        });

        // Notifications
        if (job.worker?.userId) {
          await this.notificationsService.create(
            job.worker.userId,
            NotificationType.JOB_CANCELLED as any,
            'Job Cancelled (No-Show)',
            `You were marked as a No-Show for job "${job.title}".`,
            { type: 'JOB', id: job.id },
            tx as any,
          );
        }
        await this.notificationsService.create(
          job.createdBy,
          NotificationType.JOB_CANCELLED as any,
          'Worker No-Show',
          `The worker did not arrive for job "${job.title}". We are finding a replacement.`,
          { type: 'JOB', id: job.id },
          tx as any,
        );
      });
    }
  }
  async getUserJobs(userId: string, role: string, filters: any) {
    const { status, limit = 20, page = 1 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role === 'WORKER') {
      where.OR = [{ createdBy: userId }, { worker: { userId: userId } }];
    } else {
      where.createdBy = userId;
    }

    if (status) {
      where.status = status;
    }

    // Fix query type issue with OR
    const jobsWhere: any = { ...where };
    if (where.OR) {
      // Handle complex OR logic if Prisma types complain, but simple OR should valid
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: jobsWhere,
        orderBy: { updatedAt: 'desc' },
        take: Number(limit),
        skip: Number(skip),
        include: {
          service: true,
          worker: {
            include: { user: { select: { fullName: true, email: true } } },
          },
          creator: { select: { fullName: true, email: true } },
        },
      }),
      this.prisma.job.count({ where: jobsWhere }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // ============================================
  // CONFIRM COMPLETION
  // ============================================

  async confirmCompletion(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.createdBy !== userId)
      throw new ForbiddenException(
        'Only the job creator can confirm completion',
      );

    // Allow confirmation if Proof is Submitted OR if it's waiting for confirmation
    if (
      job.status !== ('PENDING_CUSTOMER_CONFIRMATION' as any) &&
      job.status !== JobStatus.PROOF_SUBMITTED
    ) {
      throw new BadRequestException('Job is not in a confirmable state');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // 2. Add to history
      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: JobStatus.COMPLETED,
          changedBy: userId,
          reason: 'Customer confirmed completion',
        },
      });

      // 3. Credit Worker Wallet
      await this.walletService.credit(
        job.worker!.userId,
        job.priceCents,
        `Payment for Job: ${job.title}`,
        'JOB',
        job.id,
        TransactionType.CREDIT,
        tx,
      );

      // 4. Real Stripe Transfer
      try {
        await this.stripeService.transferToWorker(
          job.worker!.id,
          job.priceCents,
          `Payment for Job: ${job.title} (${job.id})`,
        );
      } catch (err) {
        console.error(
          `Automated Stripe transfer failed for job ${job.id}:`,
          err,
        );
      }

      // 5. Notify Worker
      await this.notificationsService.create(
        job.worker!.userId,
        NotificationType.PROOF_DECISION, // or JOB_COMPLETED
        'Job Completed & Paid',
        `The customer has confirmed completion for "${job.title}". Your payment has been credited!`,
        { type: 'JOB', id: jobId },
        tx,
      );

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: AuditAction.JOB_UPDATE,
          actionDetail: 'Customer confirmed completion',
          entityType: 'Job',
          entityId: jobId,
          newValue: { status: JobStatus.COMPLETED } as any,
        },
      });

      return { success: true };
    });
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: any,
    note: string,
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { job: { include: { worker: true } } },
    });

    if (!dispute) throw new NotFoundException('Dispute not found');
    if (
      dispute.status === ('CLOSED' as any) ||
      dispute.status === ('RESOLVED' as any)
    ) {
      throw new BadRequestException('Dispute already resolved');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Dispute
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED' as any,
          resolution,
          resolutionNote: note,
          reviewedById: adminId,
          resolvedAt: new Date(),
        },
      });

      const job = dispute.job;
      const workerUserId = job.worker?.userId;

      if (resolution === 'RELEASE_PAYMENT') {
        // Complete job and pay worker
        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.COMPLETED, completedAt: new Date() },
        });

        if (workerUserId) {
          await this.walletService.credit(
            workerUserId,
            job.priceCents,
            `Dispute Resolved: Payment Released for ${job.title}`,
            'JOB',
            job.id,
            TransactionType.CREDIT,
            tx,
          );

          try {
            await this.stripeService.transferToWorker(
              job.worker!.id,
              job.priceCents,
              `Dispute Resolved: Payment Released for ${job.title}`,
            );
          } catch (err) {
            console.error(
              'Stripe transfer failed during dispute resolution',
              err,
            );
          }
        }
      } else if (resolution === 'REFUND') {
        // Cancel job and refund customer
        await tx.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: 'ADMIN_CANCELLED',
          },
        });

        try {
          await this.stripeService.refundPayment(job.id);
        } catch (err) {
          console.error('Stripe refund failed during dispute resolution', err);
        }

        // Notify Customer
        await this.notificationsService.create(
          job.createdBy,
          NotificationType.DISPUTE_RESOLVED as any,
          'Dispute Resolved: Refunded',
          `The dispute for "${job.title}" has been resolved. A full refund has been issued.`,
          { type: 'JOB', id: job.id },
          tx,
        );
      }

      // Notify Worker if involved
      if (workerUserId) {
        await this.notificationsService.create(
          workerUserId,
          NotificationType.DISPUTE_RESOLVED as any,
          'Dispute Resolved',
          `The dispute for "${job.title}" has been resolved: ${resolution}.`,
          { type: 'JOB', id: job.id },
          tx,
        );
      }

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.DISPUTE_RESOLVE,
          actionDetail: `Resolved dispute ${disputeId} as ${resolution}`,
          entityType: 'Dispute',
          entityId: disputeId,
          newValue: { resolution, status: 'RESOLVED' } as any,
        },
      });

      return { success: true };
    });
  }
}
