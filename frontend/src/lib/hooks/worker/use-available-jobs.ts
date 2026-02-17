import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Job } from '@/lib/types/worker';
import { toast } from 'sonner';

export function useAvailableJobs(filters: { serviceId?: string; district?: string; page?: number } = {}) {
    const queryClient = useQueryClient();

    const availableJobsQuery = useQuery<Job[]>({
        queryKey: ['jobs', 'available', filters],
        queryFn: async () => {
            return await api.get('/jobs/available', { params: filters });
        },
    });

    const acceptJobMutation = useMutation({
        mutationFn: async (jobId: string) => {
            return await api.post(`/jobs/${jobId}/accept`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs', 'available'] });
            queryClient.invalidateQueries({ queryKey: ['jobs', 'my'] });
            toast.success('Job accepted successfully!');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to accept job';
            toast.error(message);
        },
    });

    return {
        jobs: availableJobsQuery.data || [],
        isLoading: availableJobsQuery.isLoading,
        acceptJob: acceptJobMutation.mutate,
        isAccepting: acceptJobMutation.isPending,
        refetch: availableJobsQuery.refetch,
    };
}
