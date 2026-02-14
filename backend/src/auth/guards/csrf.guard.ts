import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CsrfGuard implements CanActivate {
    private readonly logger = new Logger(CsrfGuard.name);

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();

        // Ignore safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            return true;
        }

        const csrfToken = request.headers['x-csrf-token'];

        // Cookie-parser populates signedCookies if secret is provided in bootstrap
        const storedToken = request.signedCookies ? request.signedCookies['_csrf'] : null;

        if (!csrfToken || !storedToken || csrfToken !== storedToken) {
            this.logger.warn(`CSRF validation failed. Header: ${csrfToken ? 'Present' : 'Missing'}, Cookie: ${storedToken ? 'Present' : 'Missing'}`);
            return false; // Or throw new ForbiddenException('Invalid CSRF Token');
        }
        return true;
    }
}
