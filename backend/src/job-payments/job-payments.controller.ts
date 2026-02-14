import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JobPaymentsService } from './job-payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, JobPaymentStatus } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('admin/job-payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF) // Assuming UserRole works
export class JobPaymentsController {
  constructor(private readonly paymentsService: JobPaymentsService) {}

  @Get()
  async findAll(@Query('status') status?: JobPaymentStatus) {
    return this.paymentsService.findAll({ status });
  }

  @Patch(':id/pay') // Mark as Paid
  async markAsPaid(@Param('id') id: string, @GetUser() user: any) {
    return this.paymentsService.markAsPaid(id, user.id);
  }

  @Patch(':id/hold') // Hold Payment
  async holdPayment(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @GetUser() user: any,
  ) {
    return this.paymentsService.holdPayment(id, reason, user.id);
  }

  // Usually create is triggered by Proof event, not manually exposed
  // But for manual fix:
  @Post(':jobId/create')
  async createForJob(@Param('jobId') jobId: string, @GetUser() user: any) {
    return this.paymentsService.createPayment(jobId, user.id);
  }
}

@Controller('worker/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.WORKER)
export class WorkerJobPaymentsController {
  constructor(private readonly paymentsService: JobPaymentsService) {}

  @Get()
  async findMyPayments(@GetUser() user: any) {
    // Need service method to find by workerId
    // I'll add findAll to service filtering by workerId
    // But service.findAll accepts JobPaymentStatus filter
    // I need to filter by workerId too.
    // Let's modify service first? Or use Prisma directly logic?
    // Better update service.
    return this.paymentsService.findAll({ workerId: user.id });
  }
}
