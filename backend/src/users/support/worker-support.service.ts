import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTicketDto,
  ReplyToTicketDto,
  WorkerSupportFilterDto,
} from './dto/worker-support.dto';
import { Prisma, TicketStatus } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class WorkerSupportService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async findMyTickets(userId: string, filter: WorkerSupportFilterDto) {
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {
      createdBy: userId, // Only worker's own tickets
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.q) {
      where.subject = { contains: filter.q, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          createdAt: true,
          updatedAt: true,
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

  async createTicket(userId: string, dto: CreateTicketDto) {
    // Generate ticket number
    const count = await this.prisma.supportTicket.count();
    const ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`;

    const ticket = await this.prisma.$transaction(async (tx) => {
      // Create ticket
      const newTicket = await tx.supportTicket.create({
        data: {
          ticketNumber,
          createdBy: userId,
          subject: dto.subject,
          status: 'OPEN',
          priority: 'MEDIUM',
        },
      });

      // Create initial message
      await tx.ticketMessage.create({
        data: {
          ticketId: newTicket.id,
          senderId: userId,
          content: dto.description,
          isInternal: false,
        },
      });

      // Audit log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: 'CREATE',
          actionDetail: `Created support ticket #${ticketNumber}`,
          entityType: 'SupportTicket',
          entityId: newTicket.id,
        },
      });

      return newTicket;
    });

    // Notify staff/admin (find all staff/admin users)
    const staffUsers = await this.prisma.user.findMany({
      where: {
        role: { in: ['STAFF', 'ADMIN'] },
        isActive: true,
      },
      select: { id: true },
    });

    // Send notifications to all staff
    for (const staff of staffUsers) {
      await this.notificationsService.create(
        staff.id,
        'TICKET_UPDATE',
        'New Support Ticket',
        `New ticket created: ${dto.subject}`,
        { type: 'TICKET', id: ticket.id },
      );
    }

    return ticket;
  }

  async findMyTicket(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
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

    // Ownership check
    if (ticket.createdBy !== userId) {
      throw new ForbiddenException('You can only view your own tickets');
    }

    return ticket;
  }

  async replyToTicket(userId: string, ticketId: string, dto: ReplyToTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Ownership check
    if (ticket.createdBy !== userId) {
      throw new ForbiddenException('You can only reply to your own tickets');
    }

    // Cannot reply to closed tickets
    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    // If ticket was RESOLVED, set back to IN_PROGRESS
    let newStatus = ticket.status;
    if (ticket.status === 'RESOLVED') {
      newStatus = 'IN_PROGRESS';
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create message
      const message = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: userId,
          content: dto.message,
          isInternal: false,
        },
      });

      // Update ticket status if needed
      if (newStatus !== ticket.status) {
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: { status: newStatus },
        });
      }

      // Update updatedAt
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      // Audit log
      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: 'UPDATE',
          actionDetail: `Replied to ticket #${ticket.ticketNumber}`,
          entityType: 'SupportTicket',
          entityId: ticketId,
        },
      });

      return message;
    });

    // Notify staff/admin
    const staffUsers = await this.prisma.user.findMany({
      where: {
        role: { in: ['STAFF', 'ADMIN'] },
        isActive: true,
      },
      select: { id: true },
    });

    for (const staff of staffUsers) {
      await this.notificationsService.create(
        staff.id,
        'TICKET_UPDATE',
        'Worker Replied to Ticket',
        `Worker replied to ticket: ${ticket.subject}`,
        { type: 'TICKET', id: ticketId },
      );
    }

    return result;
  }

  async closeTicket(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Ownership check
    if (ticket.createdBy !== userId) {
      throw new ForbiddenException('You can only close your own tickets');
    }

    if (ticket.status === 'CLOSED') {
      return ticket; // Already closed
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: userId,
          action: 'UPDATE',
          actionDetail: `Closed ticket #${ticket.ticketNumber}`,
          entityType: 'SupportTicket',
          entityId: ticketId,
          oldValue: { status: ticket.status },
          newValue: { status: 'CLOSED' },
        },
      });

      return res;
    });

    // Notify staff/admin
    const staffUsers = await this.prisma.user.findMany({
      where: {
        role: { in: ['STAFF', 'ADMIN'] },
        isActive: true,
      },
      select: { id: true },
    });

    for (const staff of staffUsers) {
      await this.notificationsService.create(
        staff.id,
        'TICKET_UPDATE',
        'Ticket Closed by Worker',
        `Ticket closed: ${ticket.subject}`,
        { type: 'TICKET', id: ticketId },
      );
    }

    return updated;
  }
}
