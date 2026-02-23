import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminJobDto } from './dto/create-admin-job.dto';
import { UpdateAdminJobDto } from './dto/update-admin-job.dto';
import {
  AuditAction,
  JobStatus,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminJobsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private notificationsService: NotificationsService,
  ) { }

  async createJob(dto: CreateAdminJobDto, adminId: string) {
    // Ensure service exists and is active
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException(
        `Service with ID ${dto.serviceId} not found or inactive`,
      );
    }

    // 2. Validate conditional rules
    if (dto.paymentType === ('FIXED' as any) && dto.priceCents === undefined) {
      throw new BadRequestException('priceCents is required for FIXED payment');
    }
    if (dto.paymentType === ('HOURLY' as any)) {
      if (
        dto.hourlyRateCents === undefined ||
        dto.estimatedHours === undefined
      ) {
        throw new BadRequestException(
          'hourlyRateCents and estimatedHours are required for HOURLY payment',
        );
      }
    }
    if (
      dto.postMode === ('DIRECT_ASSIGN' as any) &&
      !dto.directAssignWorkerId
    ) {
      throw new BadRequestException(
        'directAssignWorkerId is required for DIRECT_ASSIGN mode',
      );
    }

    // 3. Compute Pricing & Fees
    // For production, we fetch platform fee from system config if not provided
    let platformFeeCents = dto.platformFeeCents || 0;
    if (dto.platformFeeCents === undefined) {
      const commissionConfig = await this.prisma.systemConfig.findUnique({
        where: { key: 'PLATFORM_COMMISSION_PERCENT' },
      });
      const commissionPercent = commissionConfig
        ? Number(commissionConfig.value)
        : 10; // Default 10%

      const workerPayout =
        dto.paymentType === ('FIXED' as any)
          ? dto.priceCents!
          : dto.hourlyRateCents! * dto.estimatedHours!;
      platformFeeCents = Math.round((workerPayout * commissionPercent) / 100);
    }

    const workerPayoutCents =
      dto.paymentType === ('FIXED' as any)
        ? dto.priceCents!
        : dto.hourlyRateCents! * dto.estimatedHours!;
    const totalCostCents = workerPayoutCents + platformFeeCents;

    return this.prisma.$transaction(async (tx) => {
      // 4. Resolve worker if direct assign
      let assignedWorkerProfileId = null;
      if (dto.postMode === ('DIRECT_ASSIGN' as any)) {
        const profile = await (tx as any).workerProfile.findUnique({
          where: { userId: dto.directAssignWorkerId },
        });
        if (!profile) {
          throw new BadRequestException(
            `Worker profile not found for user ${dto.directAssignWorkerId}`,
          );
        }
        assignedWorkerProfileId = profile.id;
      }

      // 5. Create job
      const job = await (tx as any).job.create({
        data: {
          title: dto.title,
          description: dto.description,
          notes: dto.notes,
          serviceId: dto.serviceId,
          paymentType: dto.paymentType,
          priceCents: workerPayoutCents,
          hourlyRateCents: dto.hourlyRateCents,
          estimatedHours: dto.estimatedHours,
          maxHours: dto.maxHours,
          platformFeeCents,
          totalCostCents,
          priority: dto.priority,
          executionDate: new Date(dto.executionDate),
          timeSlot: dto.timeSlot,
          mustFinishBy: dto.mustFinishBy ? new Date(dto.mustFinishBy) : null,
          requireArrival: dto.requireArrival,
          geofenceRadiusM: dto.geofenceRadiusM,
          arrivalWindowMinutes: dto.arrivalWindowMinutes,
          locationLat: dto.lat,
          locationLng: dto.lng,
          address: dto.address,
          district: dto.district,
          proofPolicy: dto.proofPolicy as any,
          minProofImages: dto.minProofImages,
          requireBeforeAfter: dto.requireBeforeAfter,
          requireGpsPhoto: dto.requireGpsPhoto,
          verifiedOnly: dto.verifiedOnly,
          minWorkerRating: dto.minWorkerRating,
          districtRestricted: dto.districtRestricted,
          postMode: dto.postMode,
          directAssignWorkerId: dto.directAssignWorkerId,
          workerId: assignedWorkerProfileId,
          notifyWorkers: dto.notifyWorkers,
          cancelAllowed: dto.cancelAllowed,
          cancelBeforeHours: dto.cancelBeforeHours,
          lateCancelFeeCents: dto.lateCancelFeeCents,
          status:
            dto.postMode === ('DIRECT_ASSIGN' as any)
              ? (JobStatus as any).ASSIGNED || 'ASSIGNED'
              : JobStatus.POSTED,
          createdBy: adminId,
        },
      });

      // 5. Create Attachments
      if (dto.attachments && dto.attachments.length > 0) {
        await (tx as any).jobAttachment.createMany({
          data: dto.attachments.map((att) => ({
            jobId: job.id,
            fileKey: att.fileKey,
            mimeType: att.mimeType,
            size: att.size || 0,
            originalName: att.originalName || 'unknown',
          })),
        });
      }

      // 6. Append status history
      await (tx as any).jobStatusHistory.create({
        data: {
          jobId: job.id,
          toStatus: JobStatus.POSTED,
          changedBy: adminId,
          reason: 'Job created via production workflow',
        },
      });

      // 7. Create audit log
      await (tx as any).adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.JOB_CREATE,
          entityType: 'Job',
          entityId: job.id,
          newValue: { ...dto, computedFee: platformFeeCents } as any,
        },
      });

      // 8. Handle Direct Assignment
      if (dto.postMode === ('DIRECT_ASSIGN' as any)) {
        // Create Assignment history
        await (tx as any).jobStatusHistory.create({
          data: {
            jobId: job.id,
            toStatus: JobStatus.POSTED, // Still posted, but assigned logic follows
            changedBy: adminId,
            reason: `Directly assigned to worker ${dto.directAssignWorkerId}`,
          },
        });

        // Notify specific worker
        await (tx as any).notification.create({
          data: {
            userId: dto.directAssignWorkerId,
            type: NotificationType.JOB_ASSIGNED,
            title: 'New Job Assigned',
            message: `You have been directly assigned a new job: ${dto.title}`,
            entityType: 'JOB',
            entityId: job.id,
            metadata: {
              priority: dto.priority,
              executionDate: dto.executionDate,
            },
          } as any,
        });
      }

      // 9. Notify workers via broadcast if public
      if (dto.notifyWorkers && dto.postMode === ('PUBLIC' as any)) {
        // Eligible workers: role=WORKER, active=true
        // Filters based on job eligibility could be applied here for fanout
        const workers = await tx.user.findMany({
          where: {
            role: UserRole.WORKER,
            isActive: true,
            workerProfile: {
              ...(dto.verifiedOnly ? { verificationStatus: 'APPROVED' } : {}),
              // districtRestricted handling would depend on where district is stored on profile
            },
          },
          select: { id: true },
        });

        const notifications = workers.map((worker: any) => ({
          userId: worker.id,
          type: NotificationType.NEW_JOB_POSTED,
          title: 'New Job in Your Area',
          message: `A new ${service.name} job is available: ${dto.title}`,
          entityType: 'JOB',
          entityId: job.id,
          metadata: {
            district: dto.district,
            price: totalCostCents,
          },
        }));

        if (notifications.length > 0) {
          await tx.notification.createMany({ data: notifications });
        }
      }

      return job;
    });
  }

  async generateAttachmentPresign(dto: any, adminId: string) {
    return this.storage.generatePresignedPutUrl(
      adminId,
      'JOB_ATTACHMENT' as any,
      dto.mimeType,
      dto.sizeBytes,
    );
  }

  async attachFiles(jobId: string, files: any[], adminId: string) {
    await (this.prisma as any).jobAttachment.createMany({
      data: files.map((f) => ({
        jobId,
        fileKey: f.fileKey,
        mimeType: f.mimeType,
        size: f.size,
        originalName: f.originalName,
      })),
    });

    await this.prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        action: AuditAction.JOB_UPDATE,
        entityType: 'Job',
        entityId: jobId,
        actionDetail: 'Added attachments',
        newValue: { attachedFileCount: files.length },
      },
    });

    return { success: true };
  }

  async getEligibleWorkers() {
    return this.prisma.user.findMany({
      where: {
        role: UserRole.WORKER,
        isActive: true,
        workerProfile: {
          verificationStatus: 'APPROVED',
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        verificationScore: true,
        workerProfile: {
          select: {
            id: true,
            // Could add rating here if tracked on profile
          },
        },
      },
    });
  }
  async reassignJob(jobId: string, newWorkerUserId: string, adminId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId: newWorkerUserId },
    });

    if (!workerProfile) {
      throw new BadRequestException('New worker profile not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // Reset job to POSTEDstate with Direct Assign
      const updatedJob = await tx.job.update({
        where: { id: jobId },
        data: {
          workerId: null, // Clear current assignment
          directAssignWorkerId: newWorkerUserId,
          postMode: 'DIRECT_ASSIGN' as any, // Enum cast
          status: JobStatus.POSTED,
          // Clear operational timestamps
          acceptedAt: null,
          arrivedAt: null,
          completedAt: null,
          cancelledAt: null, // Clear cancellation so it's active again
          cancelReason: null,
          cancelledById: null,
          // Preserve original creation info?
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          toStatus: JobStatus.POSTED,
          changedBy: adminId,
          reason: `Reassigned to worker ${workerProfile.fullName || newWorkerUserId}`,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.JOB_UPDATE,
          actionDetail: `Job reassigned to ${newWorkerUserId}`,
          entityType: 'Job',
          entityId: jobId,
          newValue: { assignedTo: newWorkerUserId, status: 'POSTED' } as any,
        },
      });

      // Notify new worker
      await this.notificationsService.create(
        newWorkerUserId,
        NotificationType.JOB_ASSIGNED,
        'Job You Reassigned',
        `You have been assigned to job "${job.title}". Please review and accept.`,
        { type: 'JOB', id: jobId },
        tx,
      );

      return updatedJob;
    });
  }
  async updateJob(jobId: string, dto: UpdateAdminJobDto, adminId: string) {
    const existingJob = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { attachments: true },
    });

    if (!existingJob) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Restriction: Cannot edit completed or cancelled jobs
    if (
      existingJob.status === JobStatus.COMPLETED ||
      existingJob.status === JobStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot edit a completed or cancelled job');
    }

    const updateData: any = { ...dto };

    // Convert dates if provided
    if (dto.executionDate) {
      updateData.executionDate = new Date(dto.executionDate);
    }
    if (dto.mustFinishBy) {
      updateData.mustFinishBy = new Date(dto.mustFinishBy);
    }

    // Map lat/lng
    if (dto.lat !== undefined) updateData.locationLat = dto.lat;
    if (dto.lng !== undefined) updateData.locationLng = dto.lng;
    delete updateData.lat;
    delete updateData.lng;

    // Recalculate price if relevant fields changed
    const paymentType = dto.paymentType || existingJob.paymentType;
    const priceCents =
      dto.priceCents !== undefined ? dto.priceCents : existingJob.priceCents;
    const hourlyRateCents =
      dto.hourlyRateCents !== undefined
        ? dto.hourlyRateCents
        : (existingJob.hourlyRateCents as any);
    const estimatedHours =
      dto.estimatedHours !== undefined
        ? dto.estimatedHours
        : (existingJob.estimatedHours as any);

    if (
      dto.paymentType !== undefined ||
      dto.priceCents !== undefined ||
      dto.hourlyRateCents !== undefined ||
      dto.estimatedHours !== undefined
    ) {
      const workerPayoutCents =
        paymentType === 'FIXED' ? priceCents : hourlyRateCents * estimatedHours;
      updateData.priceCents = workerPayoutCents;

      // Platform fee (simplified)
      const platformFeeCents =
        dto.platformFeeCents !== undefined
          ? dto.platformFeeCents
          : existingJob.platformFeeCents;
      updateData.totalCostCents = workerPayoutCents + platformFeeCents;
    }

    return this.prisma.$transaction(async (tx) => {
      // Handle Attachments if provided (replace strategy)
      if (dto.attachments) {
        await (tx as any).jobAttachment.deleteMany({ where: { jobId } });
        await (tx as any).jobAttachment.createMany({
          data: dto.attachments.map((att) => ({
            jobId,
            fileKey: att.fileKey,
            mimeType: att.mimeType,
            size: att.size || 0,
            originalName: att.originalName || 'unknown',
          })),
        });
      }
      delete updateData.attachments;

      // Update Job
      const updatedJob = await (tx as any).job.update({
        where: { id: jobId },
        data: updateData,
      });

      // Audit Log
      await (tx as any).adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.JOB_UPDATE,
          entityType: 'Job',
          entityId: jobId,
          oldValue: existingJob as any,
          newValue: updateData,
        },
      });

      return updatedJob;
    });
  }
}
