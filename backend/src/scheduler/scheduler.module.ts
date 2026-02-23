import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PayoutScheduler } from './payout.scheduler';
import { PayoutsModule } from '../payouts/payouts.module';
import { PrismaModule } from '../prisma/prisma.module';

import { JobsModule } from '../jobs/jobs.module';
import { JobScheduler } from './job.scheduler';

@Module({
  imports: [ScheduleModule.forRoot(), PayoutsModule, PrismaModule, JobsModule],
  providers: [PayoutScheduler, JobScheduler],
})
export class SchedulerModule {}
