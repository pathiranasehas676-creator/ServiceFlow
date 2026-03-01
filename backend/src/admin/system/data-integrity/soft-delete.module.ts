import { Module } from '@nestjs/common';
import { SoftDeleteController } from './soft-delete.controller';
import { SoftDeleteService } from './soft-delete.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SoftDeleteController],
  providers: [SoftDeleteService],
})
export class SoftDeleteModule {}
