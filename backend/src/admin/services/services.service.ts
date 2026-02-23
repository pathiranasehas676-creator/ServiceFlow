import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AdminServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.service.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service || service.deletedAt)
      throw new NotFoundException('Service not found');
    return service;
  }

  async create(dto: CreateServiceDto, adminId: string) {
    return this.prisma.$transaction(async (tx: any) => {
      const service = await tx.service.create({
        data: {
          name: dto.name,
          description: dto.description,
          category: dto.category,
          basePriceCents: dto.basePriceCents,
          isActive: dto.isActive ?? true,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.CREATE,
          actionDetail: `Created service ${service.name}`,
          entityType: 'Service',
          entityId: service.id,
          newValue: service,
        },
      });
      return service;
    });
  }

  async update(id: string, dto: UpdateServiceDto, adminId: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx: any) => {
      const oldValue = await tx.service.findUnique({ where: { id } });
      const service = await tx.service.update({
        where: { id },
        data: {
          ...dto,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.UPDATE,
          actionDetail: `Updated service ${service.name}`,
          entityType: 'Service',
          entityId: service.id,
          oldValue: oldValue,
          newValue: service,
        },
      });
      return service;
    });
  }

  async remove(id: string, adminId: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx: any) => {
      const service = await tx.service.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: AuditAction.DELETE,
          actionDetail: `Soft-deleted service ${service.name}`,
          entityType: 'Service',
          entityId: service.id,
        },
      });
      return service;
    });
  }
}
