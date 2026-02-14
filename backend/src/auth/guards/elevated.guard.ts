import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElevatedGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const elevatedToken = request.headers['x-elevated-token'];

    if (!elevatedToken) {
      throw new UnauthorizedException(
        'This action requires elevated authentication',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(elevatedToken, {
        secret: this.configService.get('JWT_SECRET'),
      });

      if (!payload.elevated) {
        throw new UnauthorizedException('Invalid elevated token');
      }

      return true;
    } catch {
      throw new UnauthorizedException('Elevated session expired or invalid');
    }
  }
}
