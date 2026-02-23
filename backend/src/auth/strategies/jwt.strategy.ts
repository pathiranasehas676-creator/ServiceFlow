import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.query?.token as string,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    // 1. Session Fingerprinting Check
    if (payload.sid) {
      const session: any = await this.prisma.userSession.findUnique({
        where: { id: payload.sid },
      });

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session has been revoked or expired.');
      }

      // Strict fingerprinting (can be disabled for some proxy setups)
      const currentIp = req.ip || req.headers['x-forwarded-for'];
      if (
        session.ipAddress !== currentIp &&
        this.configService.get('STRICT_SESSION_CHECK') === 'true'
      ) {
        throw new UnauthorizedException(
          'IP address mismatch. Please login again.',
        );
      }
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      sessionId: payload.sid,
    };
  }
}
