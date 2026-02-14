import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Job } from '@/lib/types/worker';
import { toast } from 'sonner';
import { useWorkerProfile } from './use-worker-profile';
import { queueService } from '@/lib/offline/queue-service';

export function useMyJobs(status?: string) {
    const queryClient = useQueryClient();

    const myJobsQuery = useQuery<Job[]>({
        queryKey: ['jobs', 'my', status],
        queryFn: async () => {
            const response = await apiClient.get('/jobs/my', { params: { status } });
            return response.data;
        },
    });

    return {
        jobs: myJobsQuery.data || [],
        isLoading: myJobsQuery.isLoading,
        refetch: myJobsQuery.refetch,
    };
}

export function useJobDetail(jobId: string) {
    const queryClient = useQueryClient();
    const { profile } = useWorkerProfile();

    const jobQuery = useQuery<Job>({
        queryKey: ['jobs', 'detail', jobId],
        queryFn: async () => {
            const response = await apiClient.get(`/jobs/${jobId}`);
            return response.data;
        },
        enabled: !!jobId,
    });

    const arrivedMutation = useMutation({
        mutationFn: async (coords: { lat: number; lng: number }) => {
            const response = await apiClient.post(`/jobs/${jobId}/arrived`, coords);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
            toast.success("Arrival marked successfully!");
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to mark arrival';
            toast.error(message);
        },
    });

    const submitProofMutation = useMutation({
        mutationFn: async (proofUrls: string[]) => {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                if (!profile?.id) throw new Error("Authentication required to queue actions");

                await queueService.enqueue({
                    type: 'PROOF_SUBMIT',
                    userId: profile.id,
                    payload: { jobId, proofs: proofUrls },
                    dedupeKey: `proofSubmit:${jobId}`
                });
                return { offline: true };
            }
            const response = await apiClient.post(`/jobs/${jobId}/proof/submit`, { proofUrls });
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
            if (data?.offline) {
                toast.info("Proof submission queued for later (Offline)");
            } else {
                toast.success("Work proof submitted for review");
            }
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to submit work proof");
        },
    });

    return {
        job: jobQuery.data,
        isLoading: jobQuery.isLoading,
        markArrived: arrivedMutation.mutate,
        isMarkingArrived: arrivedMutation.isPending,
        submitProof: submitProofMutation.mutate,
        isSubmittingProof: submitProofMutation.isPending,
    };
}
