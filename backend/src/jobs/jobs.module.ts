import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsCommentsController } from './jobs-comments.controller';
import { JobsCommentsService } from './jobs-comments.service';
import { JobsCleanupService } from './jobs-cleanup.service';
import { WalletModule } from '../wallet/wallet.module';
import { ProfilePolicyModule } from '../profile-policy/profile-policy.module';
import { PaymentsModule } from '../payments/payments.module';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [
    StorageModule,
    NotificationsModule,
    WalletModule,
    ProfilePolicyModule,
    PaymentsModule,
    RiskModule,
  ],
  controllers: [JobsController, JobsCommentsController],
  providers: [JobsService, JobsCommentsService, JobsCleanupService],
  exports: [JobsService],
})
export class JobsModule { }
