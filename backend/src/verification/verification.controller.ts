import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('worker/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WORKER')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Get('status')
  async getStatus(@GetUser() user: any) {
    return this.verificationService.getVerificationStatus(user.id);
  }

  @Post('id/start-upload')
  async startIdUpload(
    @GetUser() user: any,
    @Body() body: { files: { type: string; size: number; mimeType: string }[] },
  ) {
    return this.verificationService.startIdUpload(user.id, body.files);
  }

  @Post('id/submit')
  async submitId(@GetUser() user: any, @Body() body: any) {
    return this.verificationService.submitIdVerification(user.id, body);
  }

  @Post('bank/submit')
  async submitBank(@GetUser() user: any, @Body() body: any) {
    return this.verificationService.submitBankDetails(user.id, body);
  }
}
