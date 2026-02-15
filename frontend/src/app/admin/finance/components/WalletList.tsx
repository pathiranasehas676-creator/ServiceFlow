'use client';

import * as React from 'react';
import { Wallet, Search } from 'lucide-react';
import {
    Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export function WalletList() {
    const [wallets, setWallets] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');

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

    React.useEffect(() => {
        fetchWallets();
    }, []);

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

    const filteredWallets = wallets.filter((w) =>
        w.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        w.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Card>
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-indigo-500" /> Wallet Balances
                    </CardTitle>
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by worker..."
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
                            <TableHead>Available</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : filteredWallets.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No wallets found.</TableCell></TableRow>
                        ) : (
                            filteredWallets.map((wallet) => (
                                <TableRow key={wallet.id}>
                                    <TableCell className="pl-6 font-medium">
                                        <div>{wallet.user?.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{wallet.user?.email}</div>
                                    </TableCell>
                                    <TableCell>${((wallet.pendingBalanceCents || 0) / 100).toFixed(2)}</TableCell>
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
    );
}
