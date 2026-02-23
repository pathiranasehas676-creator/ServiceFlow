'use client';

import * as React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { DollarSign, AlertCircle, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Wallet {
    availableBalanceCents: number;
    pendingBalanceCents: number;
    totalEarnedCents: number;
    currency: string;
}

interface Transaction {
    id: string;
    type: string;
    amountCents: number;
    description: string;
    createdAt: string;
    status: string;
}

export default function WorkerWalletPage() {
    const queryClient = useQueryClient();
    const [payoutAmount, setPayoutAmount] = React.useState('');

    const { data: wallet, isLoading: isWalletLoading } = useQuery<Wallet>({
        queryKey: ['wallet', 'my'],
        queryFn: async () => await api.get('/wallet/my'),
    });

    const { data: transactions, isLoading: isTransactionsLoading } = useQuery<{ data: Transaction[] }>({
        queryKey: ['wallet', 'transactions'],
        queryFn: async () => await api.get('/wallet/transactions'),
    });

    const { data: integrity } = useQuery<{ walletValid: boolean }>({
        queryKey: ['wallet', 'integrity'],
        queryFn: async () => await api.get('/wallet/integrity'),
    });

    const { data: payouts, isLoading: isPayoutsLoading } = useQuery<any[]>({
        queryKey: ['payouts', 'history'],
        queryFn: async () => await api.get('/payouts/my-history'),
    });

    const requestPayout = useMutation({
        mutationFn: async (amount: number) => {
            await api.post('/payouts/request', { amountCents: amount });
        },
        onSuccess: () => {
            toast.success('Payout request submitted!');
            setPayoutAmount('');
            queryClient.invalidateQueries({ queryKey: ['wallet'] });
            queryClient.invalidateQueries({ queryKey: ['payouts'] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to request payout');
        }
    });

    const { data: stripeStatus } = useQuery({
        queryKey: ['stripe', 'status'],
        queryFn: async () => await api.get('/payments/worker/status'),
    });

    const onboardMutation = useMutation({
        mutationFn: async () => {
            const { url } = await api.post('/payments/worker/onboard');
            window.location.href = url;
        },
    });

    const handleRequestPayout = () => {
        const amount = parseFloat(payoutAmount) * 100;
        if (isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (amount < 1000) { // $10 min
            toast.error('Minimum payout amount is $10.00');
            return;
        }
        if (wallet && amount > wallet.availableBalanceCents) {
            toast.error('Insufficient available balance');
            return;
        }
        requestPayout.mutate(amount);
    };

    if (isWalletLoading) return <div className="p-8">Loading wallet...</div>;

    const available = (wallet?.availableBalanceCents || 0) / 100;
    const pending = (wallet?.pendingBalanceCents || 0) / 100;

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-black tracking-tight">Financial Hub</h1>
                {integrity?.walletValid === true ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-1.5 rounded-xl flex items-center gap-2 hover:bg-emerald-100 transition-colors cursor-default">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="font-bold uppercase tracking-tight text-[10px]">Data Integrity Verified (HMAC-SHA256)</span>
                    </Badge>
                ) : integrity?.walletValid === false ? (
                    <Badge variant="destructive" className="px-4 py-1.5 rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-bold uppercase tracking-tight text-[10px]">Security Alert: Integrity Mismatch</span>
                    </Badge>
                ) : null}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" /> Available Balance
                        </CardTitle>
                        <CardDescription>Funds ready for payout</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">${available.toFixed(2)}</div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="number"
                                placeholder="Amount to withdraw"
                                className="w-full border p-2 rounded-md"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleRequestPayout}
                            disabled={!available || requestPayout.isPending}
                        >
                            {requestPayout.isPending ? 'Processing...' : 'Request Payout'}
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-600" /> Pending Balance
                        </CardTitle>
                        <CardDescription>Funds held for active jobs or payouts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-500">${pending.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Stripe Onboarding Section */}
            {!stripeStatus?.payoutsEnabled && (
                <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <ShieldCheck className="h-5 w-5 text-indigo-600" />
                            Secure Automatic Payouts
                        </CardTitle>
                        <CardDescription>
                            Connect your Stripe account to receive instant payouts to your bank account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-white rounded-lg border border-indigo-50">
                                <h4 className="text-xs font-black text-indigo-600 uppercase mb-1">Status</h4>
                                <div className="flex items-center gap-2">
                                    <Badge variant={stripeStatus?.connected ? "secondary" : "outline"}>
                                        {stripeStatus?.connected ? 'Linked' : 'Not Linked'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-indigo-50">
                                <h4 className="text-xs font-black text-indigo-600 uppercase mb-1">Requirements</h4>
                                <div className="flex items-center gap-2">
                                    <Badge variant={stripeStatus?.detailsSubmitted ? "secondary" : "outline"}>
                                        {stripeStatus?.detailsSubmitted ? 'Identity Verified' : 'Action Required'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-indigo-50">
                                <h4 className="text-xs font-black text-indigo-600 uppercase mb-1">Payouts</h4>
                                <div className="flex items-center gap-2">
                                    <Badge variant={stripeStatus?.payoutsEnabled ? "secondary" : "outline"}>
                                        {stripeStatus?.payoutsEnabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => onboardMutation.mutate()}
                            disabled={onboardMutation.isPending}
                        >
                            {onboardMutation.isPending ? 'Redirecting...' : stripeStatus?.connected ? 'Complete Onboarding' : 'Set Up Stripe Payouts'}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isPayoutsLoading ? (
                                    <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>
                                ) : (payouts as any)?.data?.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="text-muted-foreground text-center">No payouts yet.</TableCell></TableRow>
                                ) : (
                                    (payouts as any)?.data?.map((p: any) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>${(p.amountCents / 100).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        p.status === 'PAID' ? 'default' :
                                                            p.status === 'PENDING' ? 'outline' :
                                                                p.status === 'REJECTED' ? 'destructive' : 'secondary'
                                                    }
                                                >
                                                    {p.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Desc</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isTransactionsLoading ? (
                                    <TableRow><TableCell colSpan={2}>Loading...</TableCell></TableRow>
                                ) : transactions?.data?.length === 0 ? (
                                    <TableRow><TableCell colSpan={2} className="text-muted-foreground text-center">No transactions.</TableCell></TableRow>
                                ) : (
                                    transactions?.data?.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="font-medium">{tx.description}</div>
                                                <div className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${['CREDIT', 'RELEASE'].includes(tx.type) ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {['CREDIT', 'RELEASE'].includes(tx.type) ? '+' : '-'}${(tx.amountCents / 100).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
