import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PayoutScheduler } from './payout.scheduler';
import { PayoutsModule } from '../payouts/payouts.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PayoutsModule, PrismaModule],
  providers: [PayoutScheduler],
})
export class SchedulerModule {}
