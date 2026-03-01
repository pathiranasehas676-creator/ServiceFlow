import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';

import { StorageModule } from '../storage/storage.module';
import { WorkerSupportModule } from './support/worker-support.module';
import { ProfileModule } from '../profile/profile.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    WorkerSupportModule,
    ProfileModule,
    CommonModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule { }
