import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.usersService.findOne({ id: req.user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() data: any) {
    const { passwordHash, ...cleanData } = data;
    return this.usersService.updateUser({
      where: { id: req.user.userId },
      data: cleanData,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('worker-profile')
  async updateWorkerProfile(@Request() req: any, @Body() data: any) {
    return this.usersService.updateWorkerProfile(req.user.userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('submit-verification')
  @ApiOperation({ summary: 'Submit ID verification after upload' })
  async submitVerification(@Request() req: any, @Body() body: { key: string }) {
    return this.usersService.submitIdVerification(req.user.userId, body.key);
  }
}
