import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JobsCommentsController } from './jobs-comments.controller';
import { JobsCommentsService } from './jobs-comments.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [StorageModule, NotificationsModule, WalletModule],
  controllers: [JobsController, JobsCommentsController],
  providers: [JobsService, JobsCommentsService],
  exports: [JobsService],
})
export class JobsModule { }
