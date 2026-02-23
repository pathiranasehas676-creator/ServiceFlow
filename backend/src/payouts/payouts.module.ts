import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [WalletModule, NotificationsModule, StorageModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
