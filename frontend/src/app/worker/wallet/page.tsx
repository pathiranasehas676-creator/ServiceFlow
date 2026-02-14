"use client";

import { useWorkerWallet } from "@/lib/hooks/useWorkerWallet";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { PayoutRequest } from "@/types/wallet";

export default function WalletPage() {
    const { wallet, transactions, payouts, loading, requestPayout, fetchTransactions } = useWorkerWallet();
    const [requestOpen, setRequestOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [payoutType, setPayoutType] = useState<'WEEKLY' | 'SPECIAL'>('SPECIAL');
    const [page, setPage] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePageChange = (newPage: number) => {
        if (!transactions) return;
        if (newPage > 0 && newPage <= transactions.meta.lastPage) {
            setPage(newPage);
            fetchTransactions(newPage);
        }
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) return toast.error("Invalid amount");

        const cents = Math.round(amt * 100);
        if (cents < 500) return toast.error("Minimum payout is $5.00");
        if (cents > (wallet?.availableBalanceCents || 0)) return toast.error("Insufficient balance");

        setIsSubmitting(true);
        try {
            await requestPayout(cents, payoutType);
            setRequestOpen(false);
            setAmount("");
            setPayoutType('SPECIAL');
            toast.success("Payout requested successfully");
        } catch (err) {
            toast.error("Failed to request payout");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && !wallet) return <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const available = (wallet?.availableBalanceCents || 0) / 100;
    const pending = (wallet?.pendingBalanceCents || 0) / 100;
    const totalEarned = (wallet?.totalEarnedCents || 0) / 100;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'default'; // blue/primary
            case 'PAID': return 'secondary'; // gray/green depending on theme? Or strictly 'success' if available
            case 'REJECTED': return 'destructive';
            default: return 'outline'; // Pending
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                    <p className="text-muted-foreground">Manage your earnings and payouts</p>
                </div>

                <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={available < 5}>Request Payout</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleRequest}>
                            <DialogHeader>
                                <DialogTitle>Request Payout</DialogTitle>
                                <DialogDescription>
                                    Minimum payout is $5.00. Available: {formatCurrency(available)}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Payout Type</Label>
                                    <Select value={payoutType} onValueChange={(v: any) => setPayoutType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SPECIAL">Special (On Demand)</SelectItem>
                                            <SelectItem value="WEEKLY">Weekly Settlement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Amount (USD)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            min="5.00"
                                            step="0.01"
                                            max={available}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="pl-7"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Submit Request
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid sm:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(available)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(pending)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{formatCurrency(totalEarned)}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="payouts">Payout History</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-6">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions?.data.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-medium whitespace-nowrap">{formatDateTime(tx.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge variant={tx.type === 'CREDIT' ? 'default' : tx.type === 'DEBIT' && tx.status === 'PENDING' ? 'outline' : 'secondary'}>
                                                {tx.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={tx.description}>{tx.description}</TableCell>
                                        <TableCell className={`text-right font-mono font-medium ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-zinc-600'}`}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amountCents / 100)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!transactions?.data.length && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            No transactions yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {transactions && transactions.meta.lastPage > 1 && (
                            <div className="flex items-center justify-end space-x-2 p-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium px-2">
                                    Page {page} of {transactions.meta.lastPage}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= transactions.meta.lastPage}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="payouts" className="mt-6">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Rejection Reason</TableHead>
                                    <TableHead className="text-right">Receipt</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payouts.map((payout: PayoutRequest) => (
                                    <TableRow key={payout.id}>
                                        <TableCell className="whitespace-nowrap">{formatDateTime(payout.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(payout.status) as any}>
                                                {payout.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">{formatCurrency(payout.amountCents / 100)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{payout.rejectionReason || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            {payout.status === 'PAID' && payout.transactionRef?.startsWith('http') ? (
                                                <a href={payout.transactionRef} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-blue-600 hover:underline">
                                                    <Download className="mr-1 h-3 w-3" /> Receipt
                                                </a>
                                            ) : payout.status === 'PAID' ? (
                                                <span className="text-muted-foreground text-xs" title={payout.transactionRef}>Ref: {payout.transactionRef?.substring(0, 8)}...</span>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!payouts.length && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No payout requests.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
