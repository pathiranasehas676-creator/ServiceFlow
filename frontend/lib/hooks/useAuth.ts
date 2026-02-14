import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints } from '../endpoints';
import { useAuthStore, User } from '../auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    accessToken: string;
    refreshToken?: string;
    user: User;
    twoFactorRequired?: boolean;
    challengeId?: string;
}

export function useAuth() {
    const router = useRouter();
    const { accessToken, user, isAuthenticated, login, logout, setAccessToken } = useAuthStore();

    // Fetch current user
    const { data: currentUser, isLoading: isLoadingUser } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: () => api.get<User>(endpoints.auth.me),
        enabled: isAuthenticated && !!accessToken,
        retry: false,
    });

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: (credentials: LoginCredentials) =>
            api.post<LoginResponse>(endpoints.auth.login, credentials, { skipAuth: true }),
        onSuccess: (data) => {
            if (data.twoFactorRequired) {
                toast.info('2FA required. Check your email for OTP.');
                router.push(`/auth/verify-2fa?challengeId=${data.challengeId}`);
            } else {
                login(data.accessToken, data.user);
                toast.success('Login successful!');

                // Redirect based on role
                if (data.user.role === 'ADMIN' || data.user.role === 'STAFF') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/dashboard');
                }
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Login failed');
        },
    });

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: () => api.post(endpoints.auth.logout),
        onSettled: () => {
            logout();
            router.push('/auth/login');
            toast.success('Logged out successfully');
        },
    });

    return {
        user: currentUser || user,
        isAuthenticated,
        isLoading: isLoadingUser,
        login: loginMutation.mutate,
        logout: logoutMutation.mutate,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
    };
}
