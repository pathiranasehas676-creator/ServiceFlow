import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { Wallet, Transaction, PayoutRequest, PaginatedTransactions } from '@/types/wallet';

export function useWorkerWallet() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<PaginatedTransactions | null>(null);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWallet = useCallback(async () => {
        try {
            // Backend returns wallet object which includes transactions relation (top 10)
            // We can map backend response to fit Wallet type if needed, or assume backend matches
            const data = await api.get<Wallet>('/worker/wallet');
            setWallet(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch wallet');
        }
    }, []);

    const fetchTransactions = useCallback(async (page = 1, limit = 10) => {
        try {
            const data = await api.get<{ data: Transaction[], meta: any }>(`/worker/wallet/transactions?page=${page}&limit=${limit}`);
            setTransactions({
                data: data.data,
                meta: data.meta
            });
        } catch (err: any) {
            console.error('Failed to fetch transactions:', err);
        }
    }, []);

    const fetchPayouts = useCallback(async () => {
        try {
            const data = await api.get<PayoutRequest[]>('/worker/payouts');
            setPayouts(data);
        } catch (err: any) {
            console.error('Failed to fetch payouts:', err);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([fetchWallet(), fetchPayouts(), fetchTransactions(1)]);
        setLoading(false);
    }, [fetchWallet, fetchPayouts, fetchTransactions]);

    // Initial load
    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    const requestPayout = async (amountCents: number, type: 'WEEKLY' | 'SPECIAL') => {
        await api.post('/worker/payouts', { amountCents, type });
        await refreshAll();
    };

    return {
        wallet,
        transactions,
        payouts,
        loading,
        error,
        fetchTransactions,
        requestPayout,
        refreshAll
    };
}
