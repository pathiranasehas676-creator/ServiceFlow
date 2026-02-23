import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user wallet' })
  async getMyWallet(@Req() req: any) {
    return this.walletService.getWallet(req.user.userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(@Req() req: any) {
    return this.walletService.getTransactions(req.user.userId);
  }

  @Get('integrity')
  @ApiOperation({ summary: 'Verify wallet data integrity' })
  async getIntegrity(@Req() req: any) {
    return this.walletService.verifyIntegrity(req.user.userId);
  }
}
