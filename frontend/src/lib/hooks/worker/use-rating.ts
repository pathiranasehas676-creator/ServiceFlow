'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

export function useRating(jobId: string) {
    const queryClient = useQueryClient();

    const rateMutation = useMutation({
        mutationFn: async ({ score, comment }: { score: number; comment?: string }) => {
            const res = await api.post(`/jobs/${jobId}/rate`, { score, comment });
            return res;
        },
        onSuccess: () => {
            toast.success("Thank you for your rating!");
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to submit rating");
        }
    });

    return {
        rate: rateMutation.mutate,
        isRating: rateMutation.isPending
    };
}
