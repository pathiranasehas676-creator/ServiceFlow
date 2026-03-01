import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Admin Finance')
@ApiBearerAuth()
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('wallets')
  @ApiOperation({ summary: 'List all worker wallets' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'q', required: false, description: 'Search user' })
  async getWallets(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('q') q = '',
  ) {
    return this.financeService.getWallets(Number(page), Number(limit), q);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List all transactions or filter by wallet' })
  @ApiQuery({ name: 'walletId', required: false })
  async getTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('walletId') walletId?: string,
  ) {
    return this.financeService.getTransactions(
      Number(page),
      Number(limit),
      walletId,
    );
  }

  @Post('wallets/:id/adjust')
  @ApiOperation({ summary: 'Adjust wallet balance manually' })
  async adjustBalance(
    @Param('id') walletId: string,
    @Body() body: { amountCents: number; reason: string },
    @Req() req: any,
  ) {
    return this.financeService.adjustBalance(
      walletId,
      body.amountCents,
      body.reason,
      req.user.id,
    );
  }
}
