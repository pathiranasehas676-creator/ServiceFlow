import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('worker/wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.WORKER)
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get('transactions')
  async getTransactions(
    @GetUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.walletService.getTransactions(user.id, Number(page), Number(limit));
  }

  @Get()
  async getMyWallet(@GetUser() user: any) {
    return this.walletService.getWallet(user.id);
  }
}
