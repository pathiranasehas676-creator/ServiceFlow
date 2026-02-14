import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.ADMIN)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) { }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @GetUser() user: any) {
    return this.payoutsService.approvePayout(id, user.id);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @GetUser() user: any,
  ) {
    return this.payoutsService.rejectPayout(id, reason, user.id);
  }

  @Patch(':id/pay')
  async markPaid(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body('receipt') receiptUrl: string, // Or receipt ID/Key
  ) {
    return this.payoutsService.markPaid(id, user.id, receiptUrl);
  }

  @Get()
  async findAll() {
    return this.payoutsService.findAll({});
  }
}

// Separate controller for Worker
@Controller('worker/payouts')
@UseGuards(JwtAuthGuard, RolesGuard, CsrfGuard)
@Roles(UserRole.WORKER)
export class WorkerPayoutsController {
  constructor(private readonly payoutsService: PayoutsService) { }

  @Get()
  async getMyPayouts(@GetUser() user: any) {
    return this.payoutsService.getPayoutsByUser(user.id);
  }

  @Post()
  async request(
    @Body('amountCents') amountCents: number,
    @GetUser() user: any,
  ) {
    return this.payoutsService.requestPayout(user.id, amountCents);
  }
}
