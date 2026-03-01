import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    // Soft Delete Middleware
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (this as any).$use(async (params: any, next: any) => {
      const softDeleteModels = [
        'User',
        'Job',
        'Service',
        'WorkerProfile',
        'BankDetails',
        'PayoutRequest',
        'SupportTicket',
      ];

      if (params.model && softDeleteModels.includes(params.model)) {
        if (!params.args) params.args = {};

        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args.where = { ...params.args.where, deletedAt: null };
        }
        if (params.action === 'findMany') {
          if (!params.args.where) params.args.where = {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
        if (params.action === 'count') {
          if (!params.args.where) params.args.where = {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
