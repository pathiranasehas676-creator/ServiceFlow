import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints, buildQueryString } from '../endpoints';
import { toast } from 'sonner';

export interface Verification {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
    idFrontUrl?: string;
    idBackUrl?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    rejectionReason?: string;
}

interface VerificationFilters {
    status?: string;
    page?: number;
    limit?: number;
}

export function useVerifications(filters: VerificationFilters = {}) {
    return useQuery({
        queryKey: ['verifications', filters],
        queryFn: () =>
            api.get<{ data: Verification[]; total: number }>(
                `${endpoints.admin.verifications.list}${buildQueryString(filters)}`
            ),
    });
}

export function useApproveVerification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.post(endpoints.admin.verifications.approve(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verifications'] });
            toast.success('Verification approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve verification');
        },
    });
}

export function useRejectVerification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(endpoints.admin.verifications.reject(id), { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['verifications'] });
            toast.success('Verification rejected');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject verification');
        },
    });
}
