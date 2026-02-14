import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { PaginationDto, ApproveRequestDto, RejectRequestDto, MarkPaidDto, ReplyTicketDto } from './dto/requests.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { CsrfGuard } from '../auth/guards/csrf.guard';

@ApiTags('Admin - Requests')
@ApiBearerAuth()
@Controller('admin/requests')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, CsrfGuard)
@Roles('ADMIN', 'STAFF')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    // ============================================
    // PROOF APPROVALS
    // ============================================

    @Get('proofs')
    @Permissions('VIEW_JOBS')
    @ApiOperation({ summary: 'Get all proof approval requests' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'q', required: false, type: String })
    async getProofRequests(@Query() dto: PaginationDto) {
        return this.requestsService.getProofRequests(dto);
    }

    @Post('proofs/:id/approve')
    @Permissions('APPROVE_PROOFS')
    @ApiOperation({ summary: 'Approve job proof' })
    async approveProof(
        @Param('id') jobId: string,
        @Body() dto: ApproveRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.approveProof(jobId, req.user.userId, dto);
    }

    @Post('proofs/:id/reject')
    @Permissions('APPROVE_PROOFS')
    @ApiOperation({ summary: 'Reject job proof' })
    async rejectProof(
        @Param('id') jobId: string,
        @Body() dto: RejectRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.rejectProof(jobId, req.user.userId, dto);
    }

    // ============================================
    // PAYOUT REQUESTS
    // ============================================

    @Get('payouts')
    @Permissions('VIEW_PAYOUTS')
    @ApiOperation({ summary: 'Get all payout requests' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'q', required: false, type: String })
    async getPayoutRequests(@Query() dto: PaginationDto) {
        return this.requestsService.getPayoutRequests(dto);
    }

    @Post('payouts/:id/approve')
    @Permissions('APPROVE_PAYOUTS')
    @ApiOperation({ summary: 'Approve payout request' })
    async approvePayout(
        @Param('id') payoutId: string,
        @Body() dto: ApproveRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.approvePayout(payoutId, req.user.userId, dto);
    }

    @Post('payouts/:id/reject')
    @Permissions('APPROVE_PAYOUTS')
    @ApiOperation({ summary: 'Reject payout request' })
    async rejectPayout(
        @Param('id') payoutId: string,
        @Body() dto: RejectRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.rejectPayout(payoutId, req.user.userId, dto);
    }

    @Post('payouts/:id/mark-paid')
    @Permissions('APPROVE_PAYOUTS')
    @ApiOperation({ summary: 'Mark payout as paid' })
    async markPayoutPaid(
        @Param('id') payoutId: string,
        @Body() dto: MarkPaidDto,
        @Req() req: any,
    ) {
        return this.requestsService.markPayoutPaid(payoutId, req.user.userId, dto);
    }

    // ============================================
    // ID VERIFICATIONS
    // ============================================

    @Get('verifications')
    @Permissions('MANAGE_USERS')
    @ApiOperation({ summary: 'Get all ID verification requests' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'q', required: false, type: String })
    async getVerificationRequests(@Query() dto: PaginationDto) {
        return this.requestsService.getVerificationRequests(dto);
    }

    @Post('verifications/:id/approve')
    @Permissions('MANAGE_USERS')
    @ApiOperation({ summary: 'Approve ID verification' })
    async approveVerification(
        @Param('id') verificationId: string,
        @Body() dto: ApproveRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.approveVerification(verificationId, req.user.userId, dto);
    }

    @Post('verifications/:id/reject')
    @Permissions('MANAGE_USERS')
    @ApiOperation({ summary: 'Reject ID verification' })
    async rejectVerification(
        @Param('id') verificationId: string,
        @Body() dto: RejectRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.rejectVerification(verificationId, req.user.userId, dto);
    }

    // ============================================
    // BANK VERIFICATIONS
    // ============================================

    @Get('banks')
    @Permissions('MANAGE_PAYOUTS')
    @ApiOperation({ summary: 'Get all bank verification requests' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'q', required: false, type: String })
    async getBankRequests(@Query() dto: PaginationDto) {
        return this.requestsService.getBankVerificationRequests(dto);
    }

    @Post('banks/:id/approve')
    @Permissions('MANAGE_PAYOUTS')
    @ApiOperation({ summary: 'Approve bank verification' })
    async approveBank(
        @Param('id') id: string,
        @Body() dto: ApproveRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.approveBankVerification(id, req.user.userId, dto);
    }

    @Post('banks/:id/reject')
    @Permissions('MANAGE_PAYOUTS')
    @ApiOperation({ summary: 'Reject bank verification' })
    async rejectBank(
        @Param('id') id: string,
        @Body() dto: RejectRequestDto,
        @Req() req: any,
    ) {
        return this.requestsService.rejectBankVerification(id, req.user.userId, dto);
    }

    // ============================================
    // SUPPORT TICKETS
    // ============================================

    @Get('tickets')
    @Permissions('VIEW_SUPPORT')
    @ApiOperation({ summary: 'Get all support tickets' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiQuery({ name: 'q', required: false, type: String })
    async getTickets(@Query() dto: PaginationDto) {
        return this.requestsService.getTickets(dto);
    }

    @Post('tickets/:id/reply')
    @Permissions('VIEW_SUPPORT')
    @ApiOperation({ summary: 'Reply to support ticket' })
    async replyToTicket(
        @Param('id') ticketId: string,
        @Body() dto: ReplyTicketDto,
        @Req() req: any,
    ) {
        return this.requestsService.replyToTicket(ticketId, req.user.userId, dto);
    }

    @Post('tickets/:id/close')
    @Permissions('VIEW_SUPPORT')
    @ApiOperation({ summary: 'Close support ticket' })
    async closeTicket(
        @Param('id') ticketId: string,
        @Req() req: any,
    ) {
        return this.requestsService.closeTicket(ticketId, req.user.userId);
    }
}
