import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole, NotificationType } from '@prisma/client';

@Injectable()
export class JobsCommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  async createComment(jobId: string, userId: string, message: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { creator: true, worker: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const canComment =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.STAFF ||
      job.worker?.userId === userId ||
      job.createdBy === userId;

    if (!canComment) {
      throw new ForbiddenException(
        'You do not have permission to comment on this job',
      );
    }

    const comment = await this.prisma.jobComment.create({
      data: {
        jobId,
        senderId: userId,
        message,
      },
      include: { sender: { select: { fullName: true, role: true } } },
    });

    // Notify opposite party/parties
    const targets: string[] = [];
    if (userId === job.createdBy) {
      if (job.worker?.userId) targets.push(job.worker.userId);
    } else if (job.worker?.userId === userId) {
      targets.push(job.createdBy);
    } else {
      // Staff/Admin comment - notify both
      targets.push(job.createdBy);
      if (job.worker?.userId) targets.push(job.worker.userId);
    }

    for (const targetId of targets) {
      if (targetId !== userId) {
        await this.notificationsService.create(
          targetId,
          NotificationType.COMMENT_REPLY,
          'New Job Comment',
          `${user.fullName} commented: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          { type: 'JOB', id: jobId },
        );
      }
    }

    return comment;
  }

  async getComments(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { worker: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const canView =
      user.role === UserRole.ADMIN ||
      user.role === UserRole.STAFF ||
      job.worker?.userId === userId ||
      job.createdBy === userId;

    if (!canView) {
      throw new ForbiddenException('You cannot view comments for this job');
    }

    return this.prisma.jobComment.findMany({
      where: { jobId },
      include: { sender: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
