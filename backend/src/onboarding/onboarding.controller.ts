import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  Req,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { RequestAccessDto } from './dto/request-access.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth') // Group under Auth for docs
@Controller('auth')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('request-access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request access to the platform (Workers)' })
  @ApiResponse({ status: 200, description: 'Request submitted successfully' })
  @ApiResponse({ status: 409, description: 'User or request already exists' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async requestAccess(@Body() dto: RequestAccessDto) {
    return this.onboardingService.requestAccess(dto);
  }

  @Get('invite/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate an invite token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  async validateInvite(@Query('token') token: string) {
    if (!token) return { valid: false };
    return this.onboardingService.validateInvite(token);
  }

  @Post('accept-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept invite and create account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async acceptInvite(@Body() dto: AcceptInviteDto, @Req() req: any) {
    return this.onboardingService.acceptInvite(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
