import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CommonModule } from '../common/common.module';

import { ProfilePolicyService } from './profile-policy.service';
import { SystemModule } from '../admin/system/system.module';

@Module({
  imports: [CommonModule, SystemModule],
  controllers: [],
  providers: [ProfileService, ProfilePolicyService],
  exports: [ProfileService, ProfilePolicyService],
})
export class ProfileModule { }
