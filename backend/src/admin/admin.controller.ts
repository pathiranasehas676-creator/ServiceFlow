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
  @Roles('ADMIN', 'STAFF')
  @Permissions('VIEW_AUDIT_LOGS')
  getAuditLogs() {
    return this.adminService.getAuditLogs();
  }

  @Get('stats/revenue')
  @Roles('ADMIN')
  @Permissions('VIEW_ANALYTICS')
  getRevenueStats() {
    return this.adminService.getRevenueStats();
  }

  @Get('stats/security')
  @Roles('ADMIN')
  @Permissions('VIEW_ANALYTICS')
  getSecurityStats() {
    return this.adminService.getSecurityStats();
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
  getVerifications(@Query('status') status?: string) {
    return this.adminService.getVerifications(status);
  }

  @Post('verifications/id/:id/approve')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  approveVerification(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Req() req: any,
  ) {
    return this.adminService.approveVerification(id, req.user.id, body.notes);
  }

  @Post('verifications/id/:id/reject')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  rejectVerification(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.adminService.rejectVerification(id, req.user.id, body.reason);
  }

  @Get('verifications/bank')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  getBankVerifications(@Query('status') status?: string) {
    return this.adminService.getBankVerifications(status);
  }

  @Post('verifications/bank/:id/approve')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  approveBankDetails(@Param('id') id: string, @Req() req: any) {
    return this.adminService.approveBankDetails(id, req.user.id);
  }

  @Post('verifications/bank/:id/reject')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  rejectBankDetails(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.adminService.rejectBankDetails(id, req.user.id, body.reason);
  }

  @Post('verifications/bulk-approve')
  @Roles('ADMIN')
  @Permissions('VERIFY_ID')
  bulkApproveVerifications(@Body('ids') ids: string[], @Req() req: any) {
    return this.adminService.bulkApproveVerifications(ids, req.user.id);
  }

  @Get('users')
  @Roles('ADMIN', 'STAFF')
  @Permissions('MANAGE_USERS')
  getUsers(@Query('status') status?: string) {
    return this.adminService.getUsers(status);
  }

  @Get('users/:id')
  @Roles('ADMIN', 'STAFF')
  @Permissions('MANAGE_USERS')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
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

  @Post('users/:id/suspend')
  @Roles('ADMIN')
  @Permissions('MANAGE_USERS')
  @UseGuards(ElevatedGuard)
  @ApiOperation({ summary: 'Suspend a user (requires re-auth)' })
  suspendUser(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    return this.adminService.suspendUser(id, req.user.id, body.reason);
  }

  @Post('users/:id/unsuspend')
  @Roles('ADMIN')
  @Permissions('MANAGE_USERS')
  @UseGuards(ElevatedGuard)
  @ApiOperation({ summary: 'Unsuspend a user (requires re-auth)' })
  unsuspendUser(@Param('id') id: string, @Req() req: any) {
    return this.adminService.unsuspendUser(id, req.user.id);
  }

  @Get('users/:id/risk-report')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  getUserRiskReport(@Param('id') id: string) {
    return this.adminService.getUserRiskReport(id);
  }

  @Post('verifications/:id/request-reupload')
  @Roles('ADMIN', 'STAFF')
  @Permissions('VERIFY_ID')
  requestVerificationReupload(
    @Param('id') id: string,
    @Body() body: { reason: string; deadlineHours?: number },
    @Req() req: any,
  ) {
    return this.adminService.requestVerificationReupload(
      id,
      req.user.id,
      body.reason,
      body.deadlineHours,
    );
  }

  @Get('staff/:id/permissions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get permissions for a specific staff member' })
  getStaffPermissions(@Param('id') id: string) {
    return this.adminService.getStaffPermissions(id);
  }

  @Post('staff/:id/permissions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update permissions for a specific staff member' })
  updateStaffPermissions(
    @Param('id') id: string,
    @Body('permissionCodes') codes: string[],
    @Req() req: any,
  ) {
    return this.adminService.updateStaffPermissions(id, codes, req.user.id);
  }
}
