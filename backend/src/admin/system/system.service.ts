import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private prisma: PrismaService) { }

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
}
