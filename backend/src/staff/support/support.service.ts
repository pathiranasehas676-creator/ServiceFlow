import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateReplyDto,
  UpdateTicketStatusDto,
  SupportFilterDto,
} from './dto/support.dto';
import {
  Prisma,
  TicketStatus,
  AuditAction,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class StaffSupportService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(filter: SupportFilterDto) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.q) {
      where.OR = [
        { subject: { contains: filter.q, mode: 'insensitive' } },
        { ticketNumber: { contains: filter.q, mode: 'insensitive' } },
        {
          creator: {
            OR: [
              { email: { contains: filter.q, mode: 'insensitive' } },
              { fullName: { contains: filter.q, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true,
            // workerProfile: true // If needed for worker specific check
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async reply(ticketId: string, staffId: string, dto: CreateReplyDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { creator: true }, // Need creator to notify
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Auto-update status if OPEN -> IN_PROGRESS
    let newStatus = ticket.status;
    if (ticket.status === 'OPEN') {
      newStatus = 'IN_PROGRESS';
    }

    // Transaction for atomic update
    const result = await this.prisma.$transaction(async (tx) => {
      // Create message
      const message = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: staffId,
          content: dto.message,
          isInternal: false, // Staff reply visible to user
        },
      });

      // Update ticket status
      if (newStatus !== ticket.status) {
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: { status: newStatus },
        });
      }

      // Update updatedAt regardless of status change
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      // Audit Log
      await tx.adminAuditLog.create({
        data: {
          actorId: staffId,
          action: 'UPDATE' as any, // Or a custom enum if exists like TICKET_REPLY
          actionDetail: `Replied to ticket #${ticket.ticketNumber}`,
          entityType: 'SupportTicket',
          entityId: ticketId,
        },
      });

      return message;
    });

    // Send notification (outside transaction to avoid blocking if slow, keeping async)
    await this.notificationsService.create(
      ticket.createdBy,
      'TICKET_UPDATE' as any,
      'New Reply on Ticket',
      `Staff replied to your ticket: ${ticket.subject}`,
      { type: 'TICKET', id: ticketId },
    );

    return result;
  }

  async updateStatus(
    ticketId: string,
    staffId: string,
    dto: UpdateTicketStatusDto,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === dto.status) {
      return ticket; // No change
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: dto.status,
          updatedAt: new Date(),
          // If closing/resolving, set resolvedAt/closedAt
          ...(dto.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
          ...(dto.status === 'CLOSED' ? { closedAt: new Date() } : {}),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: staffId,
          action: 'UPDATE' as any,
          actionDetail: `Changed ticket status to ${dto.status}`,
          entityType: 'SupportTicket',
          entityId: ticket.id,
          oldValue: { status: ticket.status } as any,
          newValue: { status: dto.status } as any,
        },
      });

      return res;
    });

    // Notify user
    await this.notificationsService.create(
      ticket.createdBy,
      'TICKET_UPDATE' as any,
      'Ticket Status Updated',
      `Your ticket status has been updated to ${dto.status}`,
      { type: 'TICKET', id: ticketId },
    );

    return updated;
  }
}
