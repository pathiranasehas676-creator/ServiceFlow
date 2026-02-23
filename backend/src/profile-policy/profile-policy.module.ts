import { Module } from '@nestjs/common';
import { ProfilePolicyService } from './profile-policy.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProfilePolicyService],
  exports: [ProfilePolicyService],
})
export class ProfilePolicyModule {}
