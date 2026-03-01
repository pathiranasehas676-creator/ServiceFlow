import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';
import { SecurityAlertsModule } from './admin/security/security-alerts.module';
import { RbacModule } from './admin/rbac/rbac.module';
import { SystemModule } from './admin/system/system.module';
import { JobPaymentsModule } from './job-payments/job-payments.module';
import { PayoutsModule } from './payouts/payouts.module';
import { WalletModule } from './wallet/wallet.module';
import { EmailModule } from './common/email/email.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { RiskModule } from './risk/risk.module';
import { KycModule } from './kyc/kyc.module';
import { VerificationModule } from './verification/verification.module';
import { NotificationsModule } from './notifications/notifications.module';
import { JobsModule } from './jobs/jobs.module';
import { ProfileModule } from './profile/profile.module';
import { StaffModule } from './staff/staff.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ErrorLogsModule } from './admin/system/errors/error-logs.module';
import { SoftDeleteModule } from './admin/system/data-integrity/soft-delete.module';
import { PaymentsModule } from './payments/payments.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // Global limit
      },
    ]),
    EmailModule,
    PrismaModule,
    CommonModule,
    StorageModule,
    OnboardingModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    AdminModule,
    SecurityAlertsModule,
    RbacModule,
    SystemModule,
    JobPaymentsModule,
    PayoutsModule,
    WalletModule,
    SchedulerModule,
    RiskModule,
    KycModule,
    VerificationModule,
    NotificationsModule,
    JobsModule,
    StaffModule,
    ErrorLogsModule,
    SoftDeleteModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
