import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../../wallet/wallet.module';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class AdminFinanceModule {}
