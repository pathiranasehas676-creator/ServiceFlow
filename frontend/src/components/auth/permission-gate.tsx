'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import React from 'react';

interface PermissionGateProps {
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export function PermissionGate({
    permission,
    permissions,
    requireAll = false,
    fallback = null,
    children
}: PermissionGateProps) {
    const { hasPermission, hasAnyPermission, user, isLoading } = useAuth();

    if (isLoading) return null;



    if (permission) {
        if (hasPermission(permission)) return <>{children}</>;
        return <>{fallback}</>;
    }

    if (permissions) {
        if (requireAll) {
            const hasAll = permissions.every(p => user?.permissions?.includes(p));
            if (hasAll) return <>{children}</>;
        } else {
            if (hasAnyPermission(permissions)) return <>{children}</>;
        }
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
