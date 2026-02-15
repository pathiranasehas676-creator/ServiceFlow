'use client';

import * as React from 'react';
import { DollarSign, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export function TransactionList() {
    const [transactions, setTransactions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');

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
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter((t) =>
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.referenceId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
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
    );
}
