import { Module } from '@nestjs/common';
import {
  PayoutsController,
  WorkerPayoutsController,
} from './payouts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PayoutsService } from './payouts.service';

import { StorageModule } from '../storage/storage.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, WalletModule, StorageModule, AuthModule],
  controllers: [PayoutsController, WorkerPayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule { }
