import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}

export function useNotifications(page: number = 1) {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
        queryKey: ['notifications', page],
        queryFn: async () => {
            const res = await api.get<{ data: Notification[], meta: any }>('/notifications', { params: { page } });
            return res;
        }
    });

    const unreadCountQuery = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            const res = await api.get<{ count: number }>('/notifications/unread-count');
            return res.count;
        }
    });

    // Real-time updates via SSE
    useEffect(() => {
        const token = localStorage.getItem('auth_token'); // Or however the API client gets it
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
        const eventSource = new EventSource(`${baseUrl}/notifications/stream?token=${token}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data) {
                // Invalidate queries to refresh data
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [queryClient]);

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await api.post('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        }
    });

    return {
        notifications: notificationsQuery.data?.data || [],
        meta: notificationsQuery.data?.meta || {},
        unreadCount: unreadCountQuery.data || 0,
        isLoading: notificationsQuery.isLoading,
        markRead: markReadMutation.mutate,
        markAllRead: markAllReadMutation.mutate
    };
}
