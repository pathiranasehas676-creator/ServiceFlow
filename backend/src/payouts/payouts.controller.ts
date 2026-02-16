import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Get,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, PayoutStatus } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('admin/finance/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF) // Allow Staff for most actions
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly authService: AuthService
  ) { }

  @Get()
  async findAll(@Query('status') status?: PayoutStatus, @Query('page') page = 1) {
    return this.payoutsService.findAll({ status }, Number(page));
  }

  // Sensitive Data View (Requires Password Re-Auth)
  @Post(':id/bank-details')
  @Roles(UserRole.ADMIN) // Admin only for bank details
  async viewBankDetails(@Param('id') id: string, @Body('password') password: string, @GetUser() user: any) {
    if (!password) throw new ForbiddenException('Password required');

    const validatedUser = await this.authService.validateUser(user.email, password);
    if (!validatedUser) {
      throw new ForbiddenException('Invalid password verification');
    }

    return this.payoutsService.getPayoutDetailsWithBank(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @GetUser() user: any) {
    return this.payoutsService.approvePayout(id, user.id);
  }

  @Post(':id/mark-processing')
  async markProcessing(@Param('id') id: string, @GetUser() user: any) {
    return this.payoutsService.markProcessing(id, user.id);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @GetUser() user: any,
  ) {
    return this.payoutsService.rejectPayout(id, reason, user.id);
  }

  @Post(':id/mark-paid')
  async markPaid(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body('receiptFileKey') receiptFileKey: string,
    @Body('paymentReference') paymentReference?: string,
  ) {
    return this.payoutsService.markPaid(id, user.id, receiptFileKey, paymentReference);
  }
}

// Separate controller for Worker
@Controller('worker/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.WORKER)
export class WorkerPayoutsController {
  constructor(private readonly payoutsService: PayoutsService) { }

  @Get()
  async getMyPayouts(@GetUser() user: any) {
    return this.payoutsService.getPayoutsByUser(user.id);
  }

  @Post('request')
  async request(
    @Body('amountCents') amountCents: number,
    @Body('type') type: any,
    @GetUser() user: any,
  ) {
    return this.payoutsService.requestPayout(user.id, amountCents, type);
  }

  @Get(':id/receipt-url')
  async getReceiptUrl(@Param('id') id: string, @GetUser() user: any) {
    const url = await this.payoutsService.getReceiptUrl(id, user.id);
    return { url };
  }
}
