import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ElevatedGuard } from '../auth/guards/elevated.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('stats')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VIEW_ANALYTICS')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('api-metrics')
  @Roles('ADMIN')
  @Permissions('VIEW_ANALYTICS')
  getApiMetrics() {
    return this.adminService.getApiMetrics();
  }


  @Get('audit-logs')
  @Roles('ADMIN')
  @Permissions('VIEW_AUDIT_LOGS')
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Post('payouts/:id/approve')
  @Roles('ADMIN', 'STAFF')
  @Permissions('APPROVE_PAYOUT')
  @UseGuards(ElevatedGuard)
  @ApiOperation({
    summary: 'Approve a payout (requires re-auth elevated token)',
  })
  approvePayout(@Param('id') id: string, @Req() req: any) {
    return this.adminService.approvePayout(id, req.user.id);
  }

  @Post('payouts/:id/pay')
  @Roles('ADMIN')
  @Permissions('APPROVE_PAYOUT')
  @UseGuards(ElevatedGuard)
  @ApiOperation({
    summary: 'Mark payout as paid (requires re-auth elevated token)',
  })
  markPayoutPaid(@Param('id') id: string, @Req() req: any) {
    return this.adminService.markPayoutPaid(id, req.user.id);
  }

  @Get('permissions')
  @Roles('ADMIN')
  getPermissions() {
    return this.adminService.getPermissions();
  }

  @Get('permissions/matrix')
  @Roles('ADMIN')
  getPermissionsMatrix() {
    return this.adminService.getPermissionsMatrix();
  }

  @Post('permissions/matrix')
  @Roles('ADMIN')
  @UseGuards(ElevatedGuard)
  @ApiOperation({ summary: 'Update permissions matrix (requires re-auth)' })
  updatePermissionsMatrix(@Body() matrix: Record<string, string[]>) {
    return this.adminService.updatePermissionsMatrix(matrix);
  }

  @Get('verifications')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  getVerifications() {
    return this.adminService.getVerifications();
  }

  @Post('verifications/bulk-approve')
  @Roles('ADMIN')
  @Permissions('VERIFY_ID')
  bulkApproveVerifications(@Body('ids') ids: string[], @Req() req: any) {
    return this.adminService.bulkApproveVerifications(ids, req.user.id);
  }

  @Get('users')
  @Roles('ADMIN')
  @Permissions('MANAGE_USERS')
  getUsers() {
    return this.adminService.getUsers();
  }

  @Post('users/:id/blacklist')
  @Roles('ADMIN')
  @Permissions('MANAGE_USERS')
  @UseGuards(ElevatedGuard)
  @ApiOperation({
    summary: 'Blacklist a user (requires re-auth elevated token)',
  })
  blacklistUser(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.adminService.blacklistUser(id, req.user.id, body.reason);
  }
}
