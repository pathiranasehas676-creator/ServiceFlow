import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin - Email')
@ApiBearerAuth()
@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EmailController {
    constructor(private readonly emailService: EmailService) { }

    @Post('test')
    @ApiOperation({ summary: 'Send a test email to verify configuration' })
    async sendTestEmail(@Body('to') to: string) {
        if (!to) {
            throw new BadRequestException('Recipient email address is required');
        }

        try {
            await this.emailService.send(
                to,
                'ServiceFlow Test Email',
                '<h1>Test Email</h1><p>If you see this, email sending is configured correctly!</p>',
                'Test Email. If you see this, email sending is configured correctly!',
            );
            return { message: `Test email sent successfully to ${to}` };
        } catch (error) {
            return {
                message: 'Failed to send test email',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }
}
