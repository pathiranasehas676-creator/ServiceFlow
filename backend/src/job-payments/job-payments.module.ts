import { Module } from '@nestjs/common';
import { JobPaymentsService } from './job-payments.service';
import {
  JobPaymentsController,
  WorkerJobPaymentsController,
} from './job-payments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [JobPaymentsController, WorkerJobPaymentsController],
  providers: [JobPaymentsService],
  exports: [JobPaymentsService],
})
export class JobPaymentsModule {}
