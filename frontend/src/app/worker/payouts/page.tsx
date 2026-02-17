'use client';

import * as React from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PayoutRequest {
    id: string;
    amountCents: number;
    status: string;
    createdAt: string;
    processedAt?: string;
    receipt?: {
        receiptKey: string;
    };
}

export default function WorkerPayoutsPage() {
    const [payouts, setPayouts] = React.useState<PayoutRequest[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const data = await api.get('/worker/payouts');
            setPayouts(data || []);
        } catch (error) {
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPayouts();
    }, []);

    const handleViewReceipt = async (id: string) => {
        try {
            const data = await api.get(`/worker/payouts/${id}/receipt-url`);
            if (data.url) {
                window.open(data.url, '_blank');
            } else {
                toast.error('Receipt URL not found');
            }
        } catch (error) {
            toast.error('Failed to open receipt');
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Payouts</h1>
                <p className="text-muted-foreground">Track your earnings and payment history.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Processed Date</TableHead>
                                <TableHead className="text-right">Receipt</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                            ) : payouts.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No payout history found.</TableCell></TableRow>
                            ) : (
                                payouts.map((payout) => (
                                    <TableRow key={payout.id}>
                                        <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-medium">${(payout.amountCents / 100).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                payout.status === 'PAID' ? 'default' :
                                                    payout.status === 'APPROVED' ? 'secondary' :
                                                        payout.status === 'PROCESSING' ? 'secondary' :
                                                            payout.status === 'REJECTED' ? 'destructive' : 'outline'
                                            } className={
                                                payout.status === 'PAID' ? 'bg-green-600' :
                                                    payout.status === 'PROCESSING' ? 'bg-yellow-500 text-black' : ''
                                            }>
                                                {payout.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            {payout.status === 'PAID' && payout.receipt && (
                                                <Button size="sm" variant="outline" onClick={() => handleViewReceipt(payout.id)}>
                                                    <Download className="mr-2 h-4 w-4" /> Receipt
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
