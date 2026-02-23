import { Module } from '@nestjs/common';
import { ErrorLogsController } from './error-logs.controller';
import { ErrorLogsService } from './error-logs.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { Global } from '@nestjs/common';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    ErrorLogsService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [ErrorLogsService],
})
export class ErrorLogsModule {}
