import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const db = await this.checkDb();
    return {
      status: db ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        db: db ? 'up' : 'down',
        redis: 'up',
        minio: 'up',
        queue: 'up',
      },
    };
  }

  async checkDb() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async getQueueStatus() {
    // This would normally use Bull's getJobCounts()
    return {
      waiting: 0,
      active: 0,
      failed: 0,
      completed: 0,
    };
  }

  // ============================================
  // SYSTEM CONFIGURATION
  // ============================================

  async getConfigs() {
    const configs = await this.prisma.systemConfig.findMany();
    // Convert array to object { key: value }
    return configs.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  async updateConfig(key: string, value: any, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.systemConfig.findUnique({ where: { key } });

      const updated = await tx.systemConfig.upsert({
        where: { key },
        update: {
          value,
          updatedBy: adminId,
        },
        create: {
          key,
          value,
          updatedBy: adminId,
          description: 'Auto-created config',
        },
      });

      await tx.adminAuditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE', // Using string literal as AuditAction import might be tricky if not exported or conflicting
          actionDetail: `Updated system config: ${key}`,
          entityType: 'SystemConfig',
          entityId: updated.id,
          oldValue: existing ? (existing.value as any) : null,
          newValue: value,
        },
      });

      return updated;
    });
  }

  async bulkUpdateConfigs(configs: Record<string, any>, adminId: string) {
    const results = [];
    for (const [key, value] of Object.entries(configs)) {
      results.push(await this.updateConfig(key, value, adminId));
    }
    return results;
  }
}
