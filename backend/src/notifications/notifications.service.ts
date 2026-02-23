import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { EmailService } from '../common/email/email.service';
import { EventEmitter } from 'eventemitter3';
import { fromEvent } from 'rxjs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private emitter = new EventEmitter();

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  subscribe(userId: string) {
    return fromEvent(this.emitter, `notify:${userId}`);
  }

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    entity?: { type: string; id: string },
    metadata?: any,
  ) {
    try {
      // 1. Create DB Notification
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          entityType: entity?.type,
          entityId: entity?.id,
          metadata: metadata || {},
        },
      });

      // 2. Send Email (Async, don't block)
      this.sendEmailNotification(userId, type, title, message).catch((err) => {
        this.logger.error(
          `Failed to send email notification to user ${userId}: ${err.message}`,
        );
      });

      // 3. Emit event for SSE
      this.emitter.emit(`notify:${userId}`, { data: notification });

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async sendEmailNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) return;

    // Simple Template Logic (could be extracted later)
    const emailSubject = `[ServiceFlow] ${title}`;
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>${title}</h2>
        <p>${message}</p>
        <p>Log in to ServiceFlow to view details.</p>
        <hr />
        <small>This is an automated message.</small>
      </div>
    `;

    await this.emailService.send(user.email, emailSubject, emailHtml);
  }

  async findAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: items, // Changed from 'items' to 'data' for consistency
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
