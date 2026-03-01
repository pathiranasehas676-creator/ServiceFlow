import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { AdminVerificationController } from './admin-verification.controller';
import { RiskModule } from '../risk/risk.module';
import { StorageModule } from '../storage/storage.module';
import { ProfilePolicyModule } from '../profile-policy/profile-policy.module';

@Module({
  imports: [RiskModule, StorageModule, ProfilePolicyModule],
  controllers: [VerificationController, AdminVerificationController],
  providers: [VerificationService, PrismaService],
  exports: [VerificationService],
})
export class VerificationModule {}
