import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints, buildQueryString } from '../endpoints';
import { toast } from 'sonner';

export interface JobProof {
    id: string;
    jobId: string;
    jobTitle: string;
    workerId: string;
    workerName: string;
    status: 'PROOF_SUBMITTED' | 'APPROVED' | 'REJECTED';
    images: string[];
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
}

interface ProofFilters {
    status?: string;
    page?: number;
    limit?: number;
}

export function useProofs(filters: ProofFilters = {}) {
    return useQuery({
        queryKey: ['proofs', filters],
        queryFn: () =>
            api.get<{ data: JobProof[]; total: number }>(
                `${endpoints.admin.proofs.list}${buildQueryString(filters)}`
            ),
    });
}

export function useApproveProof() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.post(endpoints.admin.proofs.approve(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proofs'] });
            toast.success('Proof approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve proof');
        },
    });
}

export function useRejectProof() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(endpoints.admin.proofs.reject(id), { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proofs'] });
            toast.success('Proof rejected');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject proof');
        },
    });
}
