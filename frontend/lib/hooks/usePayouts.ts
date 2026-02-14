import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints, buildQueryString } from '../endpoints';
import { toast } from 'sonner';

export interface Payout {
    id: string;
    workerId: string;
    workerName: string;
    workerEmail: string;
    amountCents: number;
    status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'FAILED';
    bankName: string;
    accountNumber: string;
    requestedAt: string;
    approvedAt?: string;
    paidAt?: string;
    rejectionReason?: string;
    receiptUrl?: string;
}

interface PayoutFilters {
    status?: string;
    page?: number;
    limit?: number;
}

export function usePayouts(filters: PayoutFilters = {}) {
    return useQuery({
        queryKey: ['payouts', filters],
        queryFn: () =>
            api.get<{ data: Payout[]; total: number }>(
                `${endpoints.admin.payouts.list}${buildQueryString(filters)}`
            ),
    });
}

export function useApprovePayout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.post(endpoints.admin.payouts.approve(id)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
            toast.success('Payout approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve payout');
        },
    });
}

export function useRejectPayout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(endpoints.admin.payouts.reject(id), { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
            toast.success('Payout rejected');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject payout');
        },
    });
}

export function useMarkPayoutPaid() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, receiptUrl }: { id: string; receiptUrl?: string }) =>
            api.post(endpoints.admin.payouts.markPaid(id), { receiptUrl }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
            toast.success('Payout marked as paid');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to mark payout as paid');
        },
    });
}
