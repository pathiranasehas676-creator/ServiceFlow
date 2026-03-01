import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { AdminJobsController } from './admin-jobs.controller';
import { AdminJobsService } from './admin-jobs.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsModule } from '../jobs/jobs.module';
import { SystemConfigController } from './system-config.controller';
import { WalletModule } from '../wallet/wallet.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { PaymentsModule } from '../payments/payments.module';
import { AdminServicesModule } from './services/services.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    JobsModule,
    WalletModule,
    OnboardingModule,
    PaymentsModule,
    AdminServicesModule,
  ],
  controllers: [
    AdminController,
    RequestsController,
    AdminJobsController,
    SystemConfigController,
  ],
  providers: [AdminService, RequestsService, AdminJobsService],
})
export class AdminModule { }
