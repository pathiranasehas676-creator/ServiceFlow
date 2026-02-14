'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api-client';
import { useEffect } from 'react';

export function useJobComments(jobId: string) {
    const queryClient = useQueryClient();

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['jobs', 'detail', jobId, 'comments'],
        queryFn: async () => {
            const res = await apiClient.get(`/jobs/${jobId}/comments`);
            return res.data;
        },
        enabled: !!jobId
    });

    const addCommentMutation = useMutation({
        mutationFn: async (message: string) => {
            const res = await apiClient.post(`/jobs/${jobId}/comments`, { message });
            return res.data;
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
