import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SecurityFirewallInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SecurityFirewall');

  private readonly SUSPICIOUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /document\.cookie/i,
    /eval\(/i,
    /UNION\s+SELECT/i,
    /SELECT\s+.*\s+FROM/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+.*\s+SET/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
    /TRUNCATE\s+TABLE/i,
    /OR\s+1=1/i,
    /WAITFOR\s+DELAY/i, // Time-based SQLi
    /pg_sleep/i,
    /--/i, // common in SQLi
    /;--/i,
    /xp_cmdshell/i,
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest();

    // We only check POST, PUT, PATCH, DELETE for full body inspection
    // or GET/DELETE for query and params

    try {
      if (request.body) this.validate(request.body, 'BODY', request);
      if (request.query) this.validate(request.query, 'QUERY', request);
      if (request.params) this.validate(request.params, 'PARAMS', request);
    } catch (error) {
      this.logger.error(
        `Blocked request from IP: ${request.ip} - Path: ${request.url}`,
      );
      throw error;
    }

    return next.handle();
  }

  private validate(data: any, source: string, req: any) {
    const content = typeof data === 'string' ? data : JSON.stringify(data);

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(content)) {
        this.logger.warn(
          `Suspicious pattern ${pattern} detected in ${source} from IP ${req.ip}`,
        );
        throw new BadRequestException(
          'Security Policy Violation: Malicious payload detected.',
        );
      }
    }
  }
}
