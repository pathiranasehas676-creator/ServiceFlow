import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { JobStatus, AuditAction } from '@prisma/client';

@Injectable()
export class JobsCleanupService {
  private readonly logger = new Logger(JobsCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredJobs() {
    this.logger.log('Running automated job expiration cleanup...');

    const expirationThreshold = new Date();
    expirationThreshold.setHours(expirationThreshold.getHours() - 48);

    const expiredJobs = await this.prisma.job.findMany({
      where: {
        status: JobStatus.POSTED,
        createdAt: { lt: expirationThreshold },
      },
    });

    if (expiredJobs.length === 0) {
      return;
    }

    this.logger.log(`Found ${expiredJobs.length} expired jobs. Processing...`);

    for (const job of expiredJobs) {
      await this.prisma.$transaction(async (tx) => {
        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.CANCELLED },
        });

        await tx.jobStatusHistory.create({
          data: {
            jobId: job.id,
            toStatus: JobStatus.CANCELLED,
            reason:
              'Automated cleanup: Job expired after 48 hours without acceptance.',
            changedBy: 'SYSTEM',
          },
        });

        await tx.adminAuditLog.create({
          data: {
            actorId: 'SYSTEM',
            action: AuditAction.JOB_UPDATE,
            actionDetail: `System automatically expired job ${job.id}`,
            entityType: 'Job',
            entityId: job.id,
            newValue: { status: JobStatus.CANCELLED } as any,
          },
        });
      });
    }

    this.logger.log(`Successfully expired ${expiredJobs.length} jobs.`);

    // Cleanup Unpaid Jobs (24 hours)
    const unpaidThreshold = new Date();
    unpaidThreshold.setHours(unpaidThreshold.getHours() - 24);

    await this.prisma.job.deleteMany({
      where: {
        status: 'PENDING_PAYMENT' as any,
        createdAt: { lt: unpaidThreshold },
      },
    });

    // Flag Stagnant Accepted Jobs (7 Days)
    const stagnantThreshold = new Date();
    stagnantThreshold.setDate(stagnantThreshold.getDate() - 7);

    const stagnantJobs = await this.prisma.job.findMany({
      where: {
        status: JobStatus.ACCEPTED,
        updatedAt: { lt: stagnantThreshold },
      },
    });

    for (const job of stagnantJobs) {
      // We don't auto-cancel immediately, but strictly we should at least flag them or notify.
      // For this implementation, we will auto-cancel to prevent deadlock.
      await this.prisma.$transaction(async (tx) => {
        await tx.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.CANCELLED,
            cancelReason: 'OTHER' as any,
            cancelNote:
              'Stagnation: No activity for 7 days (System Auto-Cancel)',
          },
        });

        await tx.jobStatusHistory.create({
          data: {
            jobId: job.id,
            toStatus: JobStatus.CANCELLED,
            reason: 'Stagnated for > 7 days',
            changedBy: 'SYSTEM',
          },
        });
      });
    }
  }
}
