import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import {
  CreatePayoutRequestDto,
  RejectPayoutDto,
  MarkPaidDto,
} from './dto/payouts.dto';

@ApiTags('payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  // --- WORKER ENDPOINTS ---

  @Post('request')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Request a payout' })
  async requestPayout(@Req() req: any, @Body() dto: CreatePayoutRequestDto) {
    return this.payoutsService.requestPayout(req.user.userId, dto);
  }

  @Get('my-history')
  @Roles('WORKER')
  @ApiOperation({ summary: 'Get payout history' })
  async getMyHistory(@Req() req: any, @Query() query: any) {
    return this.payoutsService.findAll({ ...query, userId: req.user.userId });
  }

  @Get(':id')
  @Roles('WORKER', 'ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Get payout details' })
  async getPayout(@Param('id') id: string, @Req() req: any) {
    const isAdmin = ['ADMIN', 'STAFF'].includes(req.user.role);
    return this.payoutsService.getPayout(id, req.user.userId, isAdmin);
  }

  // --- ADMIN ENDPOINTS ---

  @Get('admin/all')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VIEW_FINANCE_DASHBOARD')
  @ApiOperation({ summary: 'List all payout requests' })
  async getAllPayouts(@Query() query: any) {
    return this.payoutsService.findAll(query);
  }

  @Post('admin/:id/approve')
  @Roles('ADMIN', 'STAFF')
  @Permissions('PROCESS_PAYOUTS')
  @ApiOperation({ summary: 'Approve a payout request' })
  async approvePayout(@Param('id') id: string, @Req() req: any) {
    return this.payoutsService.approvePayout(id, req.user.userId);
  }

  @Post('admin/:id/reject')
  @Roles('ADMIN', 'STAFF')
  @Permissions('PROCESS_PAYOUTS')
  @ApiOperation({ summary: 'Reject a payout request' })
  async rejectPayout(
    @Param('id') id: string,
    @Body() dto: RejectPayoutDto,
    @Req() req: any,
  ) {
    return this.payoutsService.rejectPayout(id, req.user.userId, dto);
  }

  @Post('admin/:id/receipt/presign')
  @Roles('ADMIN', 'STAFF')
  @Permissions('PROCESS_PAYOUTS')
  @ApiOperation({ summary: 'Get presigned URL for receipt upload' })
  async presignReceipt(
    @Param('id') id: string,
    @Body() body: { mimeType: string; size: number },
    @Req() req: any,
  ) {
    return this.payoutsService.presignReceipt(id, req.user.userId, body);
  }

  @Post('admin/:id/mark-paid')
  @Roles('ADMIN', 'STAFF')
  @Permissions('PROCESS_PAYOUTS')
  @ApiOperation({ summary: 'Mark payout as paid and attach receipt' })
  async markPaid(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @Req() req: any,
  ) {
    return this.payoutsService.markPaid(id, req.user.userId, dto);
  }
}
