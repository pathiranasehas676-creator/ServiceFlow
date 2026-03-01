import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SoftDeleteDto } from './dto/soft-delete.dto';

@Injectable()
export class SoftDeleteService {
  private readonly modelMapping: Record<string, string> = {
    users: 'user',
    jobs: 'job',
    services: 'service',
    worker_profiles: 'workerProfile',
    bank_details: 'bankDetails',
    payout_requests: 'payoutRequest',
    support_tickets: 'supportTicket',
  };

  constructor(private prisma: PrismaService) {}

  private getModel(entity: string) {
    const modelName = this.modelMapping[entity];
    // @ts-ignore - Dynamic access to Prisma models
    const model = this.prisma[modelName];

    if (!model) {
      throw new BadRequestException(`Invalid entity type: ${entity}`);
    }
    return { model, modelName: this.capitalize(modelName) };
  }

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  async softDelete(
    entity: string,
    id: string,
    adminId: string,
    dto: SoftDeleteDto,
  ) {
    const { model, modelName } = this.getModel(entity);

    // Check if exists
    const existing = await model.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`${modelName} with ID ${id} not found`);
    }

    if (existing.deletedAt) {
      throw new BadRequestException(`${modelName} is already deleted`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Perform soft delete
      // @ts-ignore
      const result = await tx[this.modelMapping[entity]].update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: adminId,
          deleteReason: dto.reason,
          ...(entity === 'users' || entity === 'services'
            ? { isActive: false }
            : {}), // specific logic for User/Service
        },
      });

      // Audit log
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'DELETE', // Using DELETE action for soft delete
          actionDetail: `Soft deleted ${entity} (${id})`,
          entityType: modelName,
          entityId: id,
          oldValue: { deletedAt: null },
          newValue: {
            deletedAt: result.deletedAt,
            reason: dto.reason,
          },
        },
      });

      return result;
    });

    return updated;
  }

  async restore(entity: string, id: string, adminId: string) {
    const { model, modelName } = this.getModel(entity);

    const existing = await model.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`${modelName} with ID ${id} not found`);
    }

    if (!existing.deletedAt) {
      throw new BadRequestException(`${modelName} is not deleted`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Restore
      // @ts-ignore
      const result = await tx[this.modelMapping[entity]].update({
        where: { id },
        data: {
          deletedAt: null,
          deletedById: null,
          deleteReason: null,
          ...(entity === 'users' || entity === 'services'
            ? { isActive: true }
            : {}),
        },
      });

      // Audit log
      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE', // Using UPDATE for restore
          actionDetail: `Restored ${entity} (${id})`,
          entityType: modelName,
          entityId: id,
          oldValue: { deletedAt: existing.deletedAt },
          newValue: { deletedAt: null },
        },
      });

      return result;
    });

    return updated;
  }
}
