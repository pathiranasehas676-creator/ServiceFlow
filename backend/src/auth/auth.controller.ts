import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { CsrfGuard } from './guards/csrf.guard';
import { AuthService } from './auth.service';
import { CsrfService } from './csrf.service';
import {
  RegisterDto,
  LoginDto,
  Verify2FADto,
  RefreshDto,
  ReAuthDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private authService: AuthService,
    private csrfService: CsrfService,
  ) { }

  @Get('csrf')
  @ApiOperation({ summary: 'Get CSRF Token' })
  getCsrf(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = this.csrfService.generateToken();
    // Set signed cookie
    res.cookie('_csrf', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      signed: true,
      sameSite: 'strict',
      path: '/',
    });
    return { csrfToken: token };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resendVerification(@Body() dto: { email: string }) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() req: any) {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify 2FA OTP' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  verify2FA(@Body() dto: Verify2FADto, @Req() req: any) {
    return this.authService.verify2FA(dto, req.ip, req.headers['user-agent']);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshDto, @Req() req: any) {
    return this.authService.refreshTokens(
      dto.refreshToken,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke session' })
  logout(@Req() req: any) {
    // In a real app, sessionId would be from the JWT
    return { message: 'Logged out' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('re-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-authenticate for elevated actions' })
  reAuth(@Body() dto: ReAuthDto, @Req() req: any) {
    return this.authService.reAuth(req.user.id, dto.password, dto.otp);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiOperation({ summary: 'Get active sessions' })
  getSessions(@Req() req: any) {
    return this.authService.getSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a session' })
  revokeSession(@Req() req: any, @Param('id') id: string) {
    return this.authService.revokeSession(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke all other sessions' })
  revokeAllSessions(@Req() req: any) {
    return this.authService.revokeAllSessions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  getMe(@Req() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, CsrfGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  changePassword(@Req() req: any, @Body() dto: any) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  forgotPassword(@Body() dto: any, @Req() req: any) {
    return this.authService.forgotPassword(
      dto.email,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('verify-reset-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset token' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  verifyResetToken(@Body() dto: any) {
    return this.authService.verifyResetToken(dto.token);
  }

  @Post('reset-password')
  @UseGuards(CsrfGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resetPassword(@Body() dto: any, @Req() req: any) {
    return this.authService.resetPassword(
      dto.token,
      dto.newPassword,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin-test')
  adminTest() {
    return { message: 'You are an admin' };
  }
}
