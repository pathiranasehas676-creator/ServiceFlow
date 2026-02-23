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
            const response = await api.get<{ data: Job[] }>('/jobs/my', { params: { status } });
            return response.data || [];
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
        mutationFn: async (params: { lat: number; lng: number; accuracyMeters?: number; isMock?: boolean }) => {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                if (!profile?.id) throw new Error("Authentication required to queue actions");
                await queueService.enqueue({
                    type: 'JOB_ARRIVE' as any,
                    userId: profile.id,
                    payload: { jobId, ...params },
                    dedupeKey: `arrive:${jobId}`
                });
                return { offline: true };
            }
            return await api.post(`/jobs/${jobId}/arrive`, params);
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
            if (data?.offline) {
                toast.info("Arrival marked offline. It will sync when signal returns.");
            } else {
                toast.success("Arrival marked successfully!");
            }
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to mark arrival';
            toast.error(message);
        },
    });

    const submitProofMutation = useMutation({
        mutationFn: async (proofs: any[]) => {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                if (!profile?.id) throw new Error("Authentication required to queue actions");

                await queueService.enqueue({
                    type: 'PROOF_SUBMIT',
                    userId: profile.id,
                    payload: { jobId, proofs },
                    dedupeKey: `proofSubmit:${jobId}`
                });
                return { offline: true };
            }
            return await api.post(`/jobs/${jobId}/proof/submit`, { proofs });
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
            toast.error(err.response?.data?.message || "Failed to submit work proof");
        },
    });

    const cancelMutation = useMutation({
        mutationFn: async (data: { reason: string; note?: string }) => {
            return await api.post(`/jobs/${jobId}/cancel`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
            toast.success("Job cancelled successfully");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to cancel job");
        }
    });

    const disputeMutation = useMutation({
        mutationFn: async (data: { reason: string; attachments?: any[] }) => {
            return await api.post(`/jobs/${jobId}/disputes`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
            toast.success("Dispute opened successfully");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to open dispute");
        }
    });

    return {
        job: jobQuery.data,
        isLoading: jobQuery.isLoading,
        markArrived: arrivedMutation.mutate,
        isMarkingArrived: arrivedMutation.isPending,
        submitProof: submitProofMutation.mutate,
        isSubmittingProof: submitProofMutation.isPending,
        cancelJob: cancelMutation.mutate,
        isCancelling: cancelMutation.isPending,
        openDispute: disputeMutation.mutate,
        isOpeningDispute: disputeMutation.isPending,
    };
}
