import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if accessing admin or staff routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/staff')) {
        // Get auth state from cookie or header
        // Note: Since we're using in-memory tokens, we'll check on the client side
        // This middleware primarily handles redirects for unauthenticated users

        const authCookie = request.cookies.get('auth-storage');

        // If no auth cookie, redirect to login
        if (!authCookie) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Parse auth state
        try {
            const authState = JSON.parse(authCookie.value);

            // Check if user is authenticated
            if (!authState.state?.isAuthenticated) {
                const loginUrl = new URL('/auth/login', request.url);
                loginUrl.searchParams.set('redirect', pathname);
                return NextResponse.redirect(loginUrl);
            }

            // Check if user has admin or staff role
            const userRole = authState.state?.user?.role;
            if (pathname.startsWith('/admin') && userRole !== 'ADMIN' && userRole !== 'STAFF') {
                return NextResponse.redirect(new URL('/not-authorized', request.url));
            }

            if (pathname.startsWith('/staff') && userRole !== 'STAFF' && userRole !== 'ADMIN') {
                return NextResponse.redirect(new URL('/not-authorized', request.url));
            }

        } catch (error) {
            // Invalid auth cookie
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/staff/:path*',
        // Add other protected routes here
    ],
};
