import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(
    userId: string,
    data: { subject: string; message: string; category?: string },
  ) {
    const ticketNumber = `T${Date.now()}`;
    return this.prisma.supportTicket.create({
      data: {
        createdBy: userId,
        ticketNumber,
        subject: data.subject,
        category: data.category,
        messages: {
          create: {
            senderId: userId,
            content: data.message,
          },
        },
      },
      include: { messages: true },
    });
  }

  async getTickets(userId: string, role: string) {
    if (role === 'ADMIN' || role === 'STAFF') {
      return this.prisma.supportTicket.findMany({
        include: { creator: true, messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { updatedAt: 'desc' },
      });
    }
    return this.prisma.supportTicket.findMany({
      where: { createdBy: userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addMessage(ticketId: string, senderId: string, content: string) {
    const msg = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId,
        content,
      },
    });
    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date(), status: 'IN_PROGRESS' },
    });
    return msg;
  }

  async resolveTicket(ticketId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }
}
