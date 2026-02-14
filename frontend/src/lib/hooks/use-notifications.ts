'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { useEffect } from 'react';

export function useNotifications(page: number = 1) {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
        queryKey: ['notifications', page],
        queryFn: async () => {
            const res = await apiClient.get('/worker/notifications', { params: { page } });
            return res.data;
        },
        refetchInterval: 20000, // 20s polling as requested
    });

    const unreadCountQuery = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            const res = await apiClient.get('/worker/notifications/unread-count');
            return res.data.count;
        },
        refetchInterval: 20000,
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.post(`/worker/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post('/worker/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    return {
        notifications: notificationsQuery.data?.items || [],
        meta: notificationsQuery.data?.meta || {},
        unreadCount: unreadCountQuery.data || 0,
        isLoading: notificationsQuery.isLoading,
        markRead: markReadMutation.mutate,
        markAllRead: markAllReadMutation.mutate
    };
}
