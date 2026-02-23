import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ProfileService } from '../profile/profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  UpdateProfileDto,
  UpdateBankDetailsDto,
  ChangePasswordDto,
  ConfirmProfilePhotoDto,
  SubmitIdVerificationDto,
} from '../profile/dto/profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileService: ProfileService,
  ) { }

  @Get('profile/completion-status')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Get profile completion status and eligibility' })
  async getCompletionStatus(@GetUser() user: any) {
    return this.profileService.getCompletionStatus(user.id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMyProfile(@GetUser() user: any) {
    return this.profileService.getProfile(user.id);
  }

  @Patch('profile')
  @Roles(UserRole.WORKER, UserRole.USER)
  @ApiOperation({ summary: 'Update personal profile info' })
  async updateMyProfile(@GetUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Patch('profile/online-status')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Toggle worker online/offline status' })
  async toggleOnlineStatus(
    @GetUser() user: any,
    @Body() body: { isOnline: boolean },
  ) {
    return this.profileService.toggleOnlineStatus(user.id, body.isOnline);
  }

  @Post('bank-details')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Save or update bank account details' })
  async updateMyBankDetails(
    @GetUser() user: any,
    @Body() dto: UpdateBankDetailsDto,
  ) {
    return this.profileService.updateBankDetails(user.id, dto);
  }

  @Get('bank-details')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Get masked bank details' })
  async getMyBankDetails(@GetUser() user: any) {
    const profile = await this.profileService.getProfile(user.id);
    return profile.workerProfile?.bankDetails || null;
  }

  @Post('profile-photo/confirm')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Confirm profile photo upload' })
  async confirmPhoto(
    @GetUser() user: any,
    @Body() dto: ConfirmProfilePhotoDto,
  ) {
    return this.profileService.confirmProfilePhoto(user.id, dto);
  }

  @Post('id-verification/submit')
  @Roles(UserRole.WORKER)
  @ApiOperation({ summary: 'Submit ID documents for verification' })
  async submitId(@GetUser() user: any, @Body() dto: SubmitIdVerificationDto) {
    return this.profileService.submitIdVerification(user.id, dto);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Self-service password change' })
  async changeMyPassword(@GetUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(user.id, dto);
  }

  @Get('id-upload-url')
  @ApiOperation({ summary: 'Get upload URL for ID document' })
  async getIdUploadUrl(
    @Request() req: any,
    @Query('mimeType') mimeType: string,
    @Query('sizeBytes') sizeBytes: number,
  ) {
    return this.usersService.getVerificationUploadUrl(
      req.user.userId,
      mimeType,
      Number(sizeBytes),
    );
  }

  @Get('stats/spending')
  async getSpendingStats(@Request() req: any) {
    return this.usersService.getSpendingStats(req.user.userId);
  }
}
