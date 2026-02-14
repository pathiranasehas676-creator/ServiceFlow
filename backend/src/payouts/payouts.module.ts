import { Module } from '@nestjs/common';
import {
  PayoutsController,
  WorkerPayoutsController,
} from './payouts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [PayoutsController, WorkerPayoutsController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule { }
