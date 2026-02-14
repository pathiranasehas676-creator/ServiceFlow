import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SecurityAlertsService {
  constructor(private prisma: PrismaService) { }

  async getAlerts(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.securityAlert.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, fullName: true } } },
      }),
      this.prisma.securityAlert.count(),
    ]);

    return { data, total, page, pageSize };
  }

  async resolveAlert(id: string, adminId: string) {
    return this.prisma.securityAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: adminId,
      },
    });
  }

  async createAlert(data: {
    type: string;
    severity: string;
    title: string;
    description: string;
    userId?: string;
    metadata?: any;
  }) {
    return this.prisma.securityAlert.create({ data });
  }
}
