'use client';

import * as React from 'react';
import { Search, DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function FinancePage() {
    const [wallets, setWallets] = React.useState<any[]>([]);
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [tab, setTab] = React.useState('wallets');

    const fetchWallets = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/finance/wallets');
            setWallets(res.data.data);
        } catch (error) {
            toast.error('Failed to load wallets');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/finance/transactions');
            setTransactions(res.data.data);
        } catch (error) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (tab === 'wallets') fetchWallets();
        else fetchTransactions();
    }, [tab]);

    const filteredWallets = wallets.filter((w) =>
        w.user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        w.user.email?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredTransactions = transactions.filter((t) =>
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.referenceId?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdjust = async (id: string) => {
        const amount = prompt('Enter amount in cents (positive for credit, negative for debit):');
        if (!amount) return;
        const reason = prompt('Enter reason for adjustment:');
        if (!reason) return;

        try {
            await apiClient.post(`/admin/finance/wallets/${id}/adjust`, {
                amountCents: Number(amount),
                reason,
            });
            toast.success('Wallet adjusted successfully');
            fetchWallets();
        } catch (error) {
            toast.error('Failed to adjust wallet');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Overview</h1>
                    <p className="text-muted-foreground">Monitor worker earnings, payouts, and system transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => tab === 'wallets' ? fetchWallets() : fetchTransactions()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="wallets" onValueChange={setTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="wallets">Worker Wallets</TabsTrigger>
                    <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                </TabsList>

                <TabsContent value="wallets" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-indigo-500" /> Wallet Balances
                                </CardTitle>
                                <div className="relative w-80">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by worker name or email..."
                                        className="pl-9 bg-muted/20"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="pl-6">Worker</TableHead>
                                        <TableHead>Pending</TableHead>
                                        <TableHead>Confirmed</TableHead>
                                        <TableHead>Available</TableHead>
                                        <TableHead className="text-right pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                                    ) : filteredWallets.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No wallets found.</TableCell></TableRow>
                                    ) : (
                                        filteredWallets.map((wallet) => (
                                            <TableRow key={wallet.id}>
                                                <TableCell className="pl-6 font-medium">
                                                    <div>{wallet.user?.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{wallet.user?.email}</div>
                                                </TableCell>
                                                <TableCell>${((wallet.pendingBalanceCents || 0) / 100).toFixed(2)}</TableCell>
                                                <TableCell>${((wallet.confirmedBalanceCents || 0) / 100).toFixed(2)}</TableCell>
                                                <TableCell className="font-bold text-green-600">${((wallet.availableBalanceCents || 0) / 100).toFixed(2)}</TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="outline" size="sm" onClick={() => handleAdjust(wallet.id)}>
                                                        Adjust Balance
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-500" /> System Transactions
                                </CardTitle>
                                <div className="relative w-80">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search description or reference..."
                                        className="pl-9 bg-muted/20"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="pl-6">Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right pr-6">Balance After</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell></TableRow>
                                    ) : filteredTransactions.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No transactions found.</TableCell></TableRow>
                                    ) : (
                                        filteredTransactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="pl-6 text-xs text-muted-foreground">
                                                    {new Date(tx.createdAt).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={tx.type === 'CREDIT' ? 'default' : 'secondary'} className={tx.type === 'CREDIT' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}>
                                                        {tx.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{tx.description}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{tx.referenceType} #{tx.referenceId?.slice(0, 8)}</div>
                                                </TableCell>
                                                <TableCell className={`font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {tx.type === 'CREDIT' ? '+' : '-'}${Math.abs(tx.amountCents / 100).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right pr-6 font-mono text-xs text-muted-foreground">
                                                    ${(tx.balanceAfterCents / 100).toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
