import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IpLockoutGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'];

    if (!ip) return true;

    const block = await (this.prisma as any).blockedIp.findUnique({
      where: { ipAddress: ip },
    });

    if (block) {
      if (!block.expiresAt || block.expiresAt > new Date()) {
        throw new ForbiddenException(
          `Access denied. Your IP (${ip}) has been flagged for suspicious activity. Reason: ${block.reason}`,
        );
      } else {
        // Expired, delete it
        await (this.prisma as any).blockedIp.delete({
          where: { id: block.id },
        });
      }
    }

    return true;
  }
}
