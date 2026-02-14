'use client';

import { useState } from 'react';
import { usePayoutRequests, useApprovePayout, useRejectPayout, useMarkPayoutPaid, type PayoutRequest } from '@/lib/hooks/admin/use-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Eye, CheckCircle, XCircle, Loader2, Upload } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function PayoutRequestsTab() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
    const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'mark-paid' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [note, setNote] = useState('');
    const [receiptFileKey, setReceiptFileKey] = useState('');
    const [transactionRef, setTransactionRef] = useState('');

    const { data, isLoading, refetch } = usePayoutRequests({ page, limit: 20, status, q: searchQuery });
    const approvePayout = useApprovePayout();
    const rejectPayout = useRejectPayout();
    const markPaid = useMarkPayoutPaid();

    const handleApprove = async () => {
        if (!selectedPayout) return;
        await approvePayout.mutateAsync({ payoutId: selectedPayout.id, note });
        setActionDialog(null);
        setSelectedPayout(null);
        setNote('');
        refetch();
    };

    const handleReject = async () => {
        if (!selectedPayout || !rejectionReason.trim()) return;
        await rejectPayout.mutateAsync({ payoutId: selectedPayout.id, reason: rejectionReason, note });
        setActionDialog(null);
        setSelectedPayout(null);
        setRejectionReason('');
        setNote('');
        refetch();
    };

    const handleMarkPaid = async () => {
        if (!selectedPayout || !receiptFileKey.trim()) return;
        await markPaid.mutateAsync({ payoutId: selectedPayout.id, receiptFileKey, transactionRef });
        setActionDialog(null);
        setSelectedPayout(null);
        setReceiptFileKey('');
        setTransactionRef('');
        refetch();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            PENDING: { variant: 'default', label: 'Pending' },
            APPROVED: { variant: 'outline', label: 'Approved' },
            PAID: { variant: 'secondary', label: 'Paid' },
            REJECTED: { variant: 'destructive', label: 'Rejected' },
        };
        const config = variants[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Payout Requests</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by worker name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="all">All Statuses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : data?.data && data.data.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Worker</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Bank Details</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requested</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((payout) => (
                                        <TableRow key={payout.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{payout.wallet?.user?.fullName || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">{payout.wallet?.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">${(payout.amountCents / 100).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{payout.type}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {payout.wallet?.user?.workerProfile?.bankDetails ? (
                                                    <div className="text-sm">
                                                        <p className="font-medium">{payout.wallet.user.workerProfile.bankDetails.bankName}</p>
                                                        <p className="text-muted-foreground">****{payout.wallet.user.workerProfile.bankDetails.accountNumberLast4}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Not set</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payout.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedPayout(payout)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {payout.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedPayout(payout);
                                                                    setActionDialog('approve');
                                                                }}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedPayout(payout);
                                                                    setActionDialog('reject');
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {payout.status === 'APPROVED' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPayout(payout);
                                                                setActionDialog('mark-paid');
                                                            }}
                                                        >
                                                            <Upload className="h-4 w-4 mr-1" />
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            No payout requests found
                        </div>
                    )}

                    {data?.meta && data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.meta.total)} of {data.meta.total} results
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= data.meta.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={!!selectedPayout && !actionDialog} onOpenChange={(open) => !open && setSelectedPayout(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Payout Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedPayout && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Worker</Label>
                                    <p className="font-medium">{selectedPayout.wallet?.user?.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{selectedPayout.wallet?.user?.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Amount</Label>
                                    <p className="font-semibold text-lg">${(selectedPayout.amountCents / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Type</Label>
                                    <Badge variant="outline" className="mt-1">{selectedPayout.type}</Badge>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedPayout.status)}</div>
                                </div>
                            </div>
                            {selectedPayout.wallet?.user?.workerProfile?.bankDetails && (
                                <div>
                                    <Label className="text-muted-foreground">Bank Details</Label>
                                    <div className="mt-2 p-4 bg-muted rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Bank Name</span>
                                            <span className="font-medium">{selectedPayout.wallet.user.workerProfile.bankDetails.bankName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Account Name</span>
                                            <span className="font-medium">{selectedPayout.wallet.user.workerProfile.bankDetails.accountName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Account Number</span>
                                            <span className="font-mono">****{selectedPayout.wallet.user.workerProfile.bankDetails.accountNumberLast4}</span>
                                        </div>
                                        {selectedPayout.wallet.user.workerProfile.bankDetails.branchCode && (
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Branch Code</span>
                                                <span className="font-mono">{selectedPayout.wallet.user.workerProfile.bankDetails.branchCode}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {selectedPayout.rejectionReason && (
                                <div>
                                    <Label className="text-muted-foreground">Rejection Reason</Label>
                                    <p className="mt-1 text-destructive">{selectedPayout.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        {selectedPayout?.status === 'PENDING' && (
                            <>
                                <Button variant="outline" onClick={() => setActionDialog('reject')}>
                                    Reject
                                </Button>
                                <Button onClick={() => setActionDialog('approve')}>
                                    Approve
                                </Button>
                            </>
                        )}
                        {selectedPayout?.status === 'APPROVED' && (
                            <Button onClick={() => setActionDialog('mark-paid')}>
                                Mark as Paid
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={actionDialog === 'approve'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Payout</DialogTitle>
                        <DialogDescription>
                            This will approve the payout request for processing.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="approve-note">Note (Optional)</Label>
                            <Textarea
                                id="approve-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add any internal notes..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} disabled={approvePayout.isPending}>
                            {approvePayout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={actionDialog === 'reject'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payout</DialogTitle>
                        <DialogDescription>
                            Funds will be returned to the worker's available balance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject-reason">Rejection Reason *</Label>
                            <Textarea
                                id="reject-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explain why the payout is being rejected..."
                                rows={3}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="reject-note">Internal Note (Optional)</Label>
                            <Textarea
                                id="reject-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add any internal notes..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || rejectPayout.isPending}
                        >
                            {rejectPayout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mark Paid Dialog */}
            <Dialog open={actionDialog === 'mark-paid'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Payout as Paid</DialogTitle>
                        <DialogDescription>
                            Upload receipt and confirm payment completion.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="receipt-key">Receipt File Key *</Label>
                            <Input
                                id="receipt-key"
                                value={receiptFileKey}
                                onChange={(e) => setReceiptFileKey(e.target.value)}
                                placeholder="e.g., receipts/payout-123.pdf"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Upload receipt to storage first, then paste the file key here
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="transaction-ref">Transaction Reference (Optional)</Label>
                            <Input
                                id="transaction-ref"
                                value={transactionRef}
                                onChange={(e) => setTransactionRef(e.target.value)}
                                placeholder="e.g., TXN-2024-001"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionDialog(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleMarkPaid}
                            disabled={!receiptFileKey.trim() || markPaid.isPending}
                        >
                            {markPaid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
