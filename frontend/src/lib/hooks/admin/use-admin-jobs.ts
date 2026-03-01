import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Job } from '@/lib/types/worker'; // Or shared types
import { toast } from 'sonner';

export function useAdminJobDetail(jobId: string) {
    const queryClient = useQueryClient();

    const jobQuery = useQuery<Job>({
        queryKey: ['admin', 'jobs', jobId],
        queryFn: async () => {
            // Admin uses generic GET /jobs/:id or specific admin endpoint?
            // Since I added GET /jobs/:id with ADMIN role allowed, we use that.
            // Or GET /admin/jobs/:id if I made one. I didn't.
            return await api.get(`/jobs/${jobId}`);
        },
        enabled: !!jobId,
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            return await api.post(`/admin/jobs/${jobId}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', jobId] });
            toast.success("Job approved and payment triggered");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to approve job");
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (reason: string) => {
            return await api.post(`/admin/jobs/${jobId}/reject`, { reason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'jobs', jobId] });
            toast.success("Job proof rejected");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to reject job");
        }
    });

    return {
        job: jobQuery.data,
        isLoading: jobQuery.isLoading,
        approveJob: approveMutation.mutate,
        isApproving: approveMutation.isPending,
        rejectJob: rejectMutation.mutate,
        isRejecting: rejectMutation.isPending,
    };
}
