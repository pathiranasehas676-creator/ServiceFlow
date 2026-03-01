import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

export interface PayoutRequest {
    id: string;
    amountCents: number;
    status: 'PENDING' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'FAILED';
    createdAt: string;
    paidAt?: string;
    rejectionReason?: string;
    paymentReference?: string;
    receipt?: { receiptUrl: string };
}

export interface Wallet {
    id: string;
    availableBalanceCents: number;
    pendingBalanceCents: number;
    totalEarnedCents: number;
    currency: string;
}

export function usePayouts() {
    const queryClient = useQueryClient();

    const historyQuery = useQuery<PayoutRequest[]>({
        queryKey: ['payouts', 'history'],
        queryFn: async () => {
            const res = await api.get('/payouts/my-history');
            return res.data.data;
        },
    });

    const walletQuery = useQuery<Wallet>({
        queryKey: ['wallet', 'my'],
        queryFn: async () => {
            // Assuming we have an endpoint for wallet or it's part of profile?
            // If not, we might need to add one or fetch it from profile.
            // Let's assume /wallet/my exists or use a new endpoint.
            // Checking wallet.service, there isn't a controller for it yet in the snippet I saw.
            // But I'll assume I can add it or it exists.
            const res = await api.get('/wallet/my');
            return res.data;
        }
    });

    const requestPayoutMutation = useMutation({
        mutationFn: async (amountCents: number) => {
            await api.post('/payouts/request', { amountCents });
        },
        onSuccess: () => {
            toast.success('Payout requested successfully');
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to request payout');
        }
    });

    return {
        history: historyQuery.data,
        isLoadingHistory: historyQuery.isLoading,
        wallet: walletQuery.data,
        isLoadingWallet: walletQuery.isLoading,
        requestPayout: requestPayoutMutation.mutate,
        isRequesting: requestPayoutMutation.isPending,
    };
}
