import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Job } from '@/lib/types/worker';
import { toast } from 'sonner';
import { useWorkerProfile } from './use-worker-profile';
import { queueService } from '@/lib/offline/queue-service';

export function useMyJobs(status?: string) {
    const queryClient = useQueryClient();

    const myJobsQuery = useQuery<Job[]>({
        queryKey: ['jobs', 'my', status],
        queryFn: async () => {
            return await api.get('/jobs/my', { params: { status } });
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
            return await api.get(`/jobs/${jobId}`);
        },
        enabled: !!jobId,
    });

    const arrivedMutation = useMutation({
        mutationFn: async (coords: { lat: number; lng: number }) => {
            return await api.post(`/jobs/${jobId}/arrived`, coords);
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
            return await api.post(`/jobs/${jobId}/proof/submit`, { proofUrls });
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
