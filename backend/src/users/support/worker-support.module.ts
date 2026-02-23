import { Module } from '@nestjs/common';
import { WorkerSupportController } from './worker-support.controller';
import { WorkerSupportService } from './worker-support.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [WorkerSupportController],
  providers: [WorkerSupportService],
})
export class WorkerSupportModule {}
