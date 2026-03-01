import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly prisma: PrismaService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      message:
        exception instanceof HttpException
          ? exception.message
          : 'Internal Server Error',
    };

    // Log to DB only for 500 errors or specific critical errors,
    // BUT user asked to log "all unhandled errors".
    // Usually 4xx are not "errors" in that sense but user input issues.
    // However, for "Error Reporting System" typically 500s are key.
    // I will log everything >= 400 BUT severity varies.
    // 500 = critical/high. 400 = low/medium.

    const is500 = httpStatus >= 500;
    const is400 = httpStatus >= 400 && httpStatus < 500;

    // Skip logging 404s to DB to avoid noise? User said "all unhandled errors".
    // NestJS handles exceptions. If I catch it, it's handled?
    // "Global Exception Filter logs all unhandled errors" usually means 500s.
    // If I log every 404, DB will explode with scanners.
    // I'll log >= 500. And maybe 400s if critical?
    // User requirement: "Global Exception Filter logs all unhandled errors into error_logs"
    // AND "id, severity..."

    if (httpStatus >= 400) {
      this.logErrorToDb(exception, request, httpStatus);
    }

    httpAdapter.reply(response, responseBody, httpStatus);
  }

  async logErrorToDb(exception: unknown, request: any, status: number) {
    try {
      const user = request.user;
      const severity = status >= 500 ? 'high' : 'low';

      let message = 'Unknown Error';
      let stack = undefined;

      if (exception instanceof Error) {
        message = exception.message;
        stack = exception.stack;
      } else if (typeof exception === 'string') {
        message = exception;
      } else if (typeof exception === 'object' && exception !== null) {
        message = (exception as any).message || JSON.stringify(exception);
      }

      // Sanitize payload
      const safePayload = this.sanitizeBody(request.body);

      await (this.prisma as any).errorLog.create({
        data: {
          severity,
          source: 'backend',
          message,
          stack,
          path: request.url,
          method: request.method,
          userId: user?.id,
          ipAddress:
            request.ip ||
            request.headers['x-forwarded-for'] ||
            request.socket.remoteAddress,
          userAgent: request.headers['user-agent'],
          safePayload: safePayload ? safePayload : undefined,
        },
      });
    } catch (e) {
      this.logger.error('Failed to log error to DB', e);
    }
  }

  sanitizeBody(body: any): any {
    if (!body) return null;
    if (typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveKeys = [
      'password',
      'token',
      'creditCard',
      'bankAccount',
      'secret',
    ];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      }
    }
    return sanitized;
  }
}
