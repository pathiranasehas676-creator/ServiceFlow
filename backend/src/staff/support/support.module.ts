import { Module } from '@nestjs/common';
import { StaffSupportController } from './support.controller';
import { StaffSupportService } from './support.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [StaffSupportController],
  providers: [StaffSupportService],
})
export class StaffSupportModule {}
