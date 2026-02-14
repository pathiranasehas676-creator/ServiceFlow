import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Wallet, Transaction, PayoutRequest } from '@/lib/types/worker';
import { toast } from 'sonner';
import { useWorkerProfile } from './use-worker-profile';
import { queueService } from '@/lib/offline/queue-service';

export function useWallet() {
    const queryClient = useQueryClient();
    const { profile } = useWorkerProfile();

    const walletQuery = useQuery<Wallet>({
        queryKey: ['worker', 'wallet'],
        queryFn: async () => {
            const response = await apiClient.get('/worker/wallet');
            return response.data;
        },
    });

    const transactionsQuery = useQuery<Transaction[]>({
        queryKey: ['worker', 'transactions'],
        queryFn: async () => {
            const response = await apiClient.get('/worker/transactions');
            return response.data;
        },
    });

    const payoutsQuery = useQuery<PayoutRequest[]>({
        queryKey: ['worker', 'payouts'],
        queryFn: async () => {
            const response = await apiClient.get('/worker/payouts');
            return response.data;
        },
    });

    const requestPayoutMutation = useMutation({
        mutationFn: async (amountCents: number) => {
            if (!navigator.onLine) {
                if (!profile?.id) throw new Error("Authentication required to queue payouts");

                await queueService.enqueue({
                    type: 'PAYOUT_REQUEST',
                    userId: profile.id,
                    payload: { amountCents },
                    dedupeKey: `payout:${amountCents}:${new Date().toISOString().split('T')[0]}`
                });
                return { offline: true };
            }
            const response = await apiClient.post('/worker/payouts', { amountCents });
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'wallet'] });
            queryClient.invalidateQueries({ queryKey: ['worker', 'payouts'] });

            if (data?.offline) {
                toast.info("Payout request queued (Offline)");
            } else {
                toast.success('Payout requested successfully');
            }
        },
        onError: (error: any) => {
            const message = error.message || error.response?.data?.message || 'Failed to request payout';
            toast.error(message);
        },
    });

    return {
        wallet: walletQuery.data,
        isLoadingWallet: walletQuery.isLoading,
        transactions: transactionsQuery.data || [],
        isLoadingTransactions: transactionsQuery.isLoading,
        payouts: payoutsQuery.data || [],
        isLoadingPayouts: payoutsQuery.isLoading,
        requestPayout: requestPayoutMutation.mutate,
        isRequestingPayout: requestPayoutMutation.isPending,
    };
}
