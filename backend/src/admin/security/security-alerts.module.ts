import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SecurityAlertsController } from './security-alerts.controller';
import { SecurityAlertsService } from './security-alerts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { IpLockoutGuard } from '../../common/guards/ip-lockout.guard';

@Module({
  imports: [PrismaModule],
  controllers: [SecurityAlertsController],
  providers: [
    SecurityAlertsService,
    {
      provide: APP_GUARD,
      useClass: IpLockoutGuard,
    },
  ],
  exports: [SecurityAlertsService],
})
export class SecurityAlertsModule {}
