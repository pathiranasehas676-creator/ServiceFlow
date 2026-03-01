import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface User {
    id: string;
    email: string;
    role: 'ADMIN' | 'STAFF' | 'WORKER' | 'USER';
    fullName: string;
    permissions: string[];
}

export function useAuth() {
    const { data: user, isLoading, error, refetch } = useQuery<User>({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            return await api.get('/auth/me');
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: false,
    });

    const hasPermission = (permission: string) => {
        if (user?.role === 'ADMIN') return true;
        return user?.permissions?.includes(permission) || false;
    };

    const hasAnyPermission = (permissions: string[]) => {
        if (user?.role === 'ADMIN') return true;
        return permissions.some(p => user?.permissions?.includes(p));
    };

    return {
        user,
        isLoading,
        error,
        refetch,
        hasPermission,
        hasAnyPermission,
        isAuthenticated: !!user,
    };
}
