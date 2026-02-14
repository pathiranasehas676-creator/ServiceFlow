'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { JobPayment } from '@/lib/types/payment';
import { Card, CardContent } from '@/components/ui/card'; // Check if these exist in ui/card.tsx
import { Badge } from '@/components/ui/badge';

export default function WorkerPaymentsPage() {
    const { data: payments, isLoading } = useQuery<JobPayment[]>({
        queryKey: ['worker', 'payments'],
        queryFn: async () => {
            const res = await apiClient.get('/worker/payments');
            return res.data;
        }
    });

    if (isLoading) return <div>Loading payments...</div>;

    if (!payments || payments.length === 0) {
        return <div className="p-4">No payments found.</div>;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold">Payments</h1>
            {payments.map(payment => (
                <Card key={payment.id} className="p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold">Job #{payment.job?.title || 'Unknown'}</h3>
                            <p className="text-sm text-gray-500">${(payment.amountCents / 100).toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <Badge variant={payment.status === 'PAID' ? 'default' : 'outline'}>
                                {payment.status}
                            </Badge>
                            <span className="text-xs text-gray-400 mt-1">
                                {new Date(payment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    {payment.status === 'PAID' && (
                        <div className="mt-2 text-xs text-green-600">
                            Paid on {new Date(payment.paidAt!).toLocaleDateString()}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}
