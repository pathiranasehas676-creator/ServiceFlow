'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { useEffect } from 'react';

export function useJobComments(jobId: string) {
    const queryClient = useQueryClient();

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['jobs', 'detail', jobId, 'comments'],
        queryFn: async () => {
            const res = await api.get(`/jobs/${jobId}/comments`);
            return res || [];
        },
        enabled: !!jobId
    });

    const addCommentMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await api.post(`/jobs/${jobId}/comments`, { message });
            return res;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId, 'comments'] });
        }
    });

    return {
        comments,
        isLoading,
        addComment: addCommentMutation.mutate,
        isAdding: addCommentMutation.isPending
    };
}
