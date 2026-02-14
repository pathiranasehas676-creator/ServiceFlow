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
import { SystemModule } from './admin/system/system.module';
import { JobPaymentsModule } from './job-payments/job-payments.module';
import { PayoutsModule } from './payouts/payouts.module';
import { WalletModule } from './wallet/wallet.module';
import { EmailModule } from './common/email/email.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { RiskModule } from './risk/risk.module';
import { KycModule } from './kyc/kyc.module';

import { EventEmitterModule } from '@nestjs/event-emitter';

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
    AuthModule,
    UsersModule,
    AdminModule,
    SecurityAlertsModule,
    SystemModule,
    JobPaymentsModule,
    PayoutsModule,
    WalletModule,
    SchedulerModule,
    RiskModule,
    KycModule,
  ],
})
export class AppModule { }
