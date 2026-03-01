'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PermissionGuardProps {
    children: React.ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
}

export function PermissionGuard({
    children,
    permission,
    permissions,
    requireAll = false
}: PermissionGuardProps) {
    const { user, isLoading, hasPermission, hasAnyPermission, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="flex h-[70vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    let allowed = true;

    if (user.role === 'ADMIN') {
        allowed = true; // Admin has all permissions implicitly or explicitly
    } else {
        if (permission) {
            allowed = hasPermission(permission);
        } else if (permissions) {
            if (requireAll) {
                allowed = permissions.every(p => hasPermission(p));
            } else {
                allowed = hasAnyPermission(permissions);
            }
        }
    }

    if (!allowed) {
        return (
            <div className="flex h-[70vh] w-full flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-destructive/10 p-6">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have the required permissions to view this page.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return <>{children}</>;
}
