'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useEffect } from 'react';

export function useNotifications(page: number = 1) {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
        queryKey: ['notifications', page],
        queryFn: async () => {
            const res = await api.get('/worker/notifications', { params: { page } });
            return res || { items: [], meta: {} };
        },
        refetchInterval: 20000, // 20s polling as requested
    });

    const unreadCountQuery = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async () => {
            const res = await api.get('/worker/notifications/unread-count');
            return res?.count || 0;
        },
        refetchInterval: 20000,
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/worker/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            await api.post('/worker/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
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
