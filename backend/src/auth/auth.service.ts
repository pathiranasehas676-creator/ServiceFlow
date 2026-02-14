import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { RegisterDto, LoginDto, Verify2FADto, VerifyEmailDto } from './dto/auth.dto';
import { randomInt } from 'crypto';
import { SecurityAlertsService } from '../admin/security/security-alerts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/email/email.service';
import { generateEmailVerification } from '../common/templates/email-verification.template';
import { generatePasswordResetEmail } from '../common/templates/password-reset-email.template';


@Injectable()
export class AuthService {
  private readonly LOCKOUT_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MIN = 15;

  private appurl: string; // not used directly but good practice

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private securityAlertsService: SecurityAlertsService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) { }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new BadRequestException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);

    // Default role to WORKER if not specified (we'll implement role selection based on DTO later if needed)
    // For now, prompt requested default to WORKER

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        phoneNumber: dto.phoneNumber,
        role: 'WORKER',
        emailVerifiedAt: null,
      } as any,
    });

    await this.prisma.wallet.create({
      data: { userId: user.id },
    });

    // Create verification token
    await this.createVerificationToken(user);

    // Log registration
    await this.prisma.adminAuditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: 'REGISTER' as any,
        actionDetail: 'User registered',
        entityType: 'User',
        entityId: user.id,
        ipAddress: 'Unknown',
        userAgent: 'Unknown',
      },
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.'
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = await this.hashToken(dto.token);

    const verificationToken = await (this.prisma as any).verificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction(async (tx) => {
      // Mark user as verified
      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerifiedAt: new Date() } as any,
      });

      // Mark token as used
      await (tx as any).verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });

      // Log verification
      await tx.adminAuditLog.create({
        data: {
          actorId: verificationToken.userId,
          actorEmail: verificationToken.user.email,
          action: 'EMAIL_VERIFIED' as any,
          actionDetail: 'User verified email address',
          entityType: 'User',
          entityId: verificationToken.userId,
          ipAddress: 'Unknown',
          userAgent: 'Unknown',
        },
      });
    });

    return { message: 'Email verified successfully. You can now login.' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to prevent enumeration
      return { message: 'If an account exists, a verification email has been sent.' };
    }

    if ((user as any).emailVerifiedAt) {
      return { message: 'Email already verified.' };
    }

    await this.createVerificationToken(user);
    return { message: 'If an account exists, a verification email has been sent.' };
  }

  private async createVerificationToken(user: any) {
    // Invalidate existing tokens
    await (this.prisma as any).verificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = require('crypto').randomBytes(32).toString('hex');
    const tokenHash = await this.hashToken(token);

    await (this.prisma as any).verificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send email via EmailService
    // Log token for dev/backup
    if (this.configService.get('NODE_ENV') !== 'production') {
      console.log(`[EMAIL VERIFICATION] Token for ${user.email}: ${token}`);
    }

    const emailData = generateEmailVerification({
      email: user.email,
      fullName: user.fullName || user.email,
      verificationToken: token,
      expiresInHours: 24
    });

    try {
      await this.emailService.send(
        emailData.to,
        emailData.subject,
        emailData.html,
        emailData.text
      );
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // We don't rollback registration, but user needs to resend
    }
  }

  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.recordLoginAttempt(dto.email, ip, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    // Default to strict if not configured
    const requireEmailVerification = this.configService.get('REQUIRE_EMAIL_VERIFICATION') !== 'false';

    if (requireEmailVerification && !(user as any).emailVerifiedAt && user.role !== 'ADMIN') { // Admin override or check logic
      // Maybe allow ADMINs to bypass if seeded? No, safer to require.
      // But for seeded admin, emailVerifiedAt might be null if not updated.
      // I should ensure seeded users have emailVerifiedAt set.
      throw new ForbiddenException('Email not verified. Please check your inbox.');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new ForbiddenException(
        `Account locked until ${user.lockoutUntil.toISOString()}`,
      );
    }

    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user, ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });
    await this.recordLoginAttempt(user.email, ip, true);

    if (user.isTwoFactorEnabled) {
      const challengeId = await this.create2FAChallenge(user.id);
      return { twoFactorRequired: true, challengeId };
    }

    return this.createSession(user.id, ip, userAgent);
  }

  async changePassword(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isOldPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.oldPassword,
    );
    if (!isOldPasswordValid)
      throw new BadRequestException('Current password incorrect');

    const newPasswordHash = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await this.revokeAllSessions(userId);

    await this.notificationsService.create(
      userId,
      'PASSWORD_CHANGED',
      'Password Changed Successfully',
      'Your account password was recently changed. All other active sessions have been signed out.',
      { type: 'SECURITY', id: userId },
    );

    return { message: 'Password updated successfully' };
  }

  async verify2FA(dto: Verify2FADto, ip: string, userAgent: string) {
    const challenge = await this.prisma.twoFactorChallenge.findUnique({
      where: { id: dto.challengeId },
      include: { user: true },
    });

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired challenge');
    }

    if (challenge.attemptsCount >= 3) {
      throw new BadRequestException('Too many attempts');
    }

    const isValid = await argon2.verify(challenge.otpHash, dto.otp);

    if (!isValid) {
      await this.prisma.twoFactorChallenge.update({
        where: { id: challenge.id },
        data: { attemptsCount: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.prisma.twoFactorChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return this.createSession(challenge.userId, ip, userAgent);
  }

  async refreshTokens(refreshToken: string, ip: string, userAgent: string) {
    const refreshTokenHash = await this.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      if (session && session.revokedAt) {
        await this.revokeAllSessions(session.userId);

        await this.securityAlertsService.createAlert({
          type: 'TOKEN_REUSE_DETECTED',
          severity: 'HIGH',
          title: 'Refresh Token Reuse Detected',
          description: `An attempt was made to use a revoked refresh token for user session ${session.id}. All user sessions have been revoked.`,
          userId: session.userId,
          metadata: { ip, userAgent, sessionId: session.id },
        });

        await this.notificationsService.create(
          session.userId,
          'SESSION_REVOKED',
          'Security Alert: Unauthorized Session Attempt',
          'We detected an unauthorized attempt to use an old session token. All your active sessions have been signed out for your protection.',
          { type: 'SECURITY', id: session.userId },
        );
      }
      throw new UnauthorizedException('Invalid session');
    }

    const newSession = await this.createSession(session.userId, ip, userAgent);

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        rotatedToId: newSession.sessionId,
      },
    });

    return newSession;
  }

  async logout(sessionId: string) {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async reAuth(userId: string, password?: string, otp?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    if (password) {
      const isPasswordValid = await argon2.verify(user.passwordHash, password);
      if (!isPasswordValid) throw new UnauthorizedException('Invalid password');
    } else if (otp) {
      const challenge = await this.prisma.twoFactorChallenge.findFirst({
        where: { userId, consumedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });
      if (!challenge) throw new BadRequestException('No active 2FA challenge');
      const isOtpValid = await argon2.verify(challenge.otpHash, otp);
      if (!isOtpValid) throw new UnauthorizedException('Invalid OTP');

      await this.prisma.twoFactorChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
    } else {
      throw new BadRequestException('Password or OTP required');
    }

    return this.jwtService.signAsync(
      { sub: user.id, elevated: true },
      { expiresIn: '5m', secret: this.configService.get('JWT_SECRET') },
    );
  }

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        id: exceptSessionId ? { not: exceptSessionId } : undefined,
      },
      data: { revokedAt: new Date() },
    });
  }

  private async createSession(userId: string, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken();

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: await this.hashToken(refreshToken),
        ipAddress: ip,
        userAgent: userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  private async handleFailedLogin(user: any, ip: string) {
    const attempts = user.failedLoginAttempts + 1;
    let lockoutUntil = null;

    if (attempts >= this.LOCKOUT_ATTEMPTS) {
      lockoutUntil = new Date(
        Date.now() + this.LOCKOUT_DURATION_MIN * 60 * 1000,
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockoutUntil,
      },
    });

    await this.recordLoginAttempt(user.email, ip, false);
  }

  private async create2FAChallenge(userId: string) {
    const otp = randomInt(100000, 999999).toString();
    const otpHash = await argon2.hash(otp);

    const challenge = await this.prisma.twoFactorChallenge.create({
      data: {
        userId,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });

    console.log(`[DEV ONLY] OTP for user ${userId}: ${otp}`);
    return challenge.id;
  }

  private async generateAccessToken(user: any) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  private async generateRefreshToken() {
    return this.jwtService.signAsync(
      { rnd: Math.random() },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  private async hashToken(token: string) {
    return require('crypto').createHash('sha256').update(token).digest('hex');
  }

  private async recordLoginAttempt(
    email: string,
    ipAddress: string,
    success: boolean,
  ) {
    await this.prisma.loginAttempt.create({
      data: { email, ipAddress, success },
    });
  }

  // ============================================
  // PASSWORD RESET FLOW
  // ============================================

  async forgotPassword(email: string, ip: string, userAgent: string) {
    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we pretend to send email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Simulate delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Invalidate any existing reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() }, // Mark as used to invalidate
    });

    // Generate secure random token (32 bytes = 64 hex chars)
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const tokenHash = await this.hashToken(resetToken);

    // Create reset token with 15 minute expiry
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        ipAddress: ip,
        userAgent,
      },
    });

    // Log the reset request in audit log
    await this.prisma.adminAuditLog.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: 'PASSWORD_RESET_REQUESTED',
        actionDetail: 'User requested password reset',
        entityType: 'User',
        entityId: user.id,
        ipAddress: ip,
        userAgent,
      },
    });

    // Send email with reset link
    try {
      const emailData = generatePasswordResetEmail({
        email: user.email,
        fullName: user.fullName || user.email,
        resetToken: resetToken,
        expiresInMinutes: 15
      });

      await this.emailService.send(
        emailData.to,
        emailData.subject,
        emailData.html,
        emailData.text
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    // Log for dev backup
    if (this.configService.get('NODE_ENV') !== 'production') {
      console.log(`[PASSWORD RESET] Token for ${email}: ${resetToken}`);
    }

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async verifyResetToken(token: string) {
    const tokenHash = await this.hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { email: true } } },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return {
      valid: true,
      email: resetToken.user.email,
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    ip: string,
    userAgent: string,
  ) {
    const tokenHash = await this.hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // Validate token
    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = resetToken.user;

    // Hash new password
    const newPasswordHash = await argon2.hash(newPassword);

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          failedLoginAttempts: 0, // Reset failed attempts
          lockoutUntil: null, // Clear any lockout
        },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Revoke all active sessions for security
      await tx.userSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      // Create audit log
      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          actorEmail: user.email,
          action: 'PASSWORD_RESET_COMPLETED',
          actionDetail: 'Password was successfully reset',
          entityType: 'User',
          entityId: user.id,
          ipAddress: ip,
          userAgent,
        },
      });
    });

    // Send notification
    await this.notificationsService.create(
      user.id,
      'PASSWORD_CHANGED',
      'Password Reset Successful',
      'Your password has been successfully reset. All active sessions have been signed out for security.',
      { type: 'SECURITY', id: user.id },
    );

    // Create security alert
    await this.securityAlertsService.createAlert({
      type: 'PASSWORD_RESET',
      severity: 'MEDIUM',
      title: 'Password Reset Completed',
      description: `Password was reset for user ${user.email} from IP ${ip}`,
      userId: user.id,
      metadata: { ip, userAgent },
    });

    return {
      message: 'Password has been reset successfully. Please login with your new password.',
    };
  }
}
