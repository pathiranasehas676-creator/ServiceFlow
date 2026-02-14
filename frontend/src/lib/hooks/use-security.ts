'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { toast } from 'sonner';

export function useSecurity() {
    const queryClient = useQueryClient();

    const sessionsQuery = useQuery({
        queryKey: ['security', 'sessions'],
        queryFn: async () => {
            const res = await apiClient.get('/auth/sessions');
            return res.data;
        }
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiClient.post('/auth/change-password', data);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Password changed successfully. All other sessions revoked.");
            queryClient.invalidateQueries({ queryKey: ['security', 'sessions'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to change password");
        }
    });

    const revokeSessionMutation = useMutation({
        mutationFn: async (sessionId: string) => {
            const res = await apiClient.post(`/auth/sessions/${sessionId}/revoke`);
            return res.data;
        },
        onSuccess: () => {
            toast.success("Session revoked");
            queryClient.invalidateQueries({ queryKey: ['security', 'sessions'] });
        }
    });

    const revokeAllSessionsMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post('/auth/sessions/revoke-all');
            return res.data;
        },
        onSuccess: () => {
            toast.success("All other sessions revoked");
            queryClient.invalidateQueries({ queryKey: ['security', 'sessions'] });
        }
    });

    return {
        sessions: sessionsQuery.data || [],
        isLoadingSessions: sessionsQuery.isLoading,
        changePassword: changePasswordMutation.mutate,
        isChangingPassword: changePasswordMutation.isPending,
        revokeSession: revokeSessionMutation.mutate,
        revokeAllSessions: revokeAllSessionsMutation.mutate
    };
}
