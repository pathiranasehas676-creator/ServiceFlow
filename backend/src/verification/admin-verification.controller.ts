import { Controller, Post, Body, UseGuards, Get, Param, Query } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('admin/verifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminVerificationController {
    constructor(private verificationService: VerificationService) { }

    @Get('queue')
    async getQueue(
        @Query('type') type: 'id' | 'bank',
        @Query('status') status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING',
        @Query('page') page = 1,
        @Query('q') q = ''
    ) {
        return this.verificationService.getVerificationQueue(type, status, parseInt(page as any) || 1, 20, q);
    }

    @Post('id/:id/approve')
    async approveId(@Param('id') id: string, @GetUser() admin: any) {
        return this.verificationService.approveIdVerification(id, admin.id);
    }

    @Post('id/:id/reject')
    async rejectId(@Param('id') id: string, @GetUser() admin: any, @Body() body: { reason: string }) {
        return this.verificationService.rejectIdVerification(id, admin.id, body.reason);
    }

    @Post('bank/:id/approve')
    async approveBank(@Param('id') id: string, @GetUser() admin: any) {
        return this.verificationService.approveBankVerification(id, admin.id);
    }

    @Post('bank/:id/reject')
    async rejectBank(@Param('id') id: string, @GetUser() admin: any, @Body() body: { reason: string }) {
        return this.verificationService.rejectBankVerification(id, admin.id, body.reason);
    }
}
