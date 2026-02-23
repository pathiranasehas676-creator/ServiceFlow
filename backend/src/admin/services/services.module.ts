import { Module } from '@nestjs/common';
import { AdminServicesController } from './services.controller';
import { AdminServicesService } from './services.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminServicesController],
  providers: [AdminServicesService],
})
export class AdminServicesModule {}
