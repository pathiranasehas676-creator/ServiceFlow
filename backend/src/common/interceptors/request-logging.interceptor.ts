import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isEnabled =
      this.config.get('REQUEST_LOGGING_ENABLED', 'true') === 'true';
    if (!isEnabled) {
      return next.handle();
    }

    // Only HTTP requests (skip websocket/queue if any)
    const ctxType = context.getType();
    if (ctxType !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, path, ip } = request;
    // user might be set by AuthGuard (so this must run AFTER AuthGuard)
    // Guards run BEFORE Interceptors. Yes.

    const userAgent = request.headers['user-agent'] || '';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(context, method, path, ip, userAgent, start),
        error: (err) =>
          this.log(context, method, path, ip, userAgent, start, err),
      }),
    );
  }

  private async log(
    context: ExecutionContext,
    method: string,
    path: string,
    ip: string,
    userAgent: string,
    start: number,
    error?: any,
  ) {
    const response = context.switchToHttp().getResponse();
    const statusCode = error ? error.status || 500 : response.statusCode;
    const durationMs = Date.now() - start;
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Guards populate this

    // Sampling
    const sampleRate = parseFloat(
      this.config.get('REQUEST_LOGGING_SAMPLE_RATE', '1.0'),
    );
    if (Math.random() > sampleRate) return;

    try {
      // Fire and forget (don't await strictly unless critical)
      await (this.prisma as any).apiRequestLog.create({
        data: {
          method,
          path: path.split('?')[0],
          statusCode,
          durationMs,
          role: user?.role || 'PUBLIC',
          userId: user?.id || null, // Optional, using FK if exists. If user.id invalid (deleted?), insert fails? No, if user exists it works. If user deleted? User object comes from Guard (DB lookup). So user exists.
          ipAddress: ip,
          userAgent: userAgent ? userAgent.substring(0, 500) : '',
          // createdAt default
        },
      });

      if (durationMs > 1000) {
        this.logger.warn(
          `Slow Request: ${method} ${path} took ${durationMs}ms`,
        );
      }
    } catch (e: any) {
      this.logger.error(`Failed to log request: ${e.message}`, e.stack);
    }
  }
}
