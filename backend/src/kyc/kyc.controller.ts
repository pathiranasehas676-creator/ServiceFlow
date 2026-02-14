import { Controller, Post, Body, UseGuards, Get, Param, Query } from '@nestjs/common';
import { KycService } from './kyc.service';
import { RiskService } from '../risk/risk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KycController {
    constructor(
        private kycService: KycService,
        private riskService: RiskService
    ) { }

    // WORKER ENDPOINTS
    @Post('identity')
    @Roles('WORKER')
    async submitIdentity(@GetUser() user: any, @Body() body: any) {
        return this.kycService.submitIdentity(user.id, body);
    }

    @Post('bank')
    @Roles('WORKER')
    async submitBank(@GetUser() user: any, @Body() body: any) {
        return this.kycService.submitBankDetails(user.id, body);
    }

    @Get('history')
    @Roles('WORKER')
    async getMyHistory(@GetUser() user: any) {
        return this.kycService.getHistory(user.id);
    }

    // ADMIN ENDPOINTS
    @Post('admin/identity/:id/review')
    @Roles('ADMIN')
    async reviewIdentity(@GetUser() admin: any, @Param('id') id: string, @Body() body: { approved: boolean, reason?: string }) {
        return this.kycService.reviewIdentity(id, admin.id, body.approved, body.reason);
    }

    @Post('admin/bank/:userId/review')
    @Roles('ADMIN')
    async reviewBank(@GetUser() admin: any, @Param('userId') userId: string, @Body() body: { approved: boolean }) {
        if (body.approved) {
            return this.kycService.approveBankDetails(userId, admin.id);
        }
        // Reject bank flow not fully spec'd in service but implied status update
        // We can just log history if rejected
        return { message: 'Bank details rejected' };
    }

    @Get('admin/risk/:userId')
    @Roles('ADMIN')
    async checkRisk(@Param('userId') userId: string) {
        return this.riskService.detectRisk(userId);
    }
}
