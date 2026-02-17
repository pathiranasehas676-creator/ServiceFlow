'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Wallet, PayoutRequest } from '@/lib/types/payment';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

export default function WorkerEarningsPage() {
    const queryClient = useQueryClient();
    const [amount, setAmount] = useState('');
    const { data: wallet } = useQuery<Wallet>({
        queryKey: ['worker', 'wallet'],
        queryFn: async () => api.get('/worker/wallet')
    });

    // Payout logic
    const { mutate: requestPayout } = useMutation({
        mutationFn: async (amountCents: number) => {
            return api.post('/worker/payouts', { amountCents });
        },
        onSuccess: () => {
            toast.success("Payout Requested");
            queryClient.invalidateQueries({ queryKey: ['worker', 'wallet'] });
            setAmount('');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to request payout');
        }
    });

    const handleRequest = () => {
        const val = parseFloat(amount) * 100;
        if (isNaN(val) || val < 500) {
            toast.error("Min amount is $5.00");
            return;
        }
        requestPayout(val);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Earnings & Wallet</h1>

            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                    <CardTitle className="text-sm text-gray-500">Available</CardTitle>
                    <div className="text-2xl font-bold text-green-600">
                        ${((wallet?.availableBalanceCents || 0) / 100).toFixed(2)}
                    </div>
                </Card>
                <Card className="p-4">
                    <CardTitle className="text-sm text-gray-500">Pending</CardTitle>
                    <div className="text-2xl font-bold text-yellow-600">
                        ${((wallet?.pendingBalanceCents || 0) / 100).toFixed(2)}
                    </div>
                </Card>
            </div>

            <Card className="p-4 space-y-4">
                <CardTitle>Request Payout</CardTitle>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <Input
                            type="number"
                            className="pl-6"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleRequest}>Request</Button>
                </div>
                <p className="text-xs text-gray-500">Minimum withdrawal: $5.00. Processing time: 24-48 hours.</p>
            </Card>
        </div>
    );
}
