'use client';

import * as React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MoreHorizontal, FileText, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PayoutReceiptUpload } from '@/components/admin/finance/payout-receipt-upload'; // Ensure import path

interface PayoutRequest {
    id: string;
    amountCents: number;
    status: string;
    createdAt: string;
    wallet: {
        user: {
            fullName: string;
            email: string;
        }
    };
    rejectionReason?: string;
    receipt?: { receiptUrl: string; receiptKey: string };
    paymentReference?: string;
}

export default function AdminPayoutsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = React.useState('ALL');
    const [search, setSearch] = React.useState('');
    const [selectedPayout, setSelectedPayout] = React.useState<PayoutRequest | null>(null);
    const [rejectReason, setRejectReason] = React.useState('');
    const [paymentRef, setPaymentRef] = React.useState('');
    const [isRejectOpen, setIsRejectOpen] = React.useState(false);
    const [isMarkPaidOpen, setIsMarkPaidOpen] = React.useState(false);
    const [isDetailOpen, setIsDetailOpen] = React.useState(false);
    const [uploadedReceipt, setUploadedReceipt] = React.useState<{ key: string; mimeType: string; size: number } | null>(null);

    const { data: payoutDetail, isLoading: isDetailLoading } = useQuery<any>({
        queryKey: ['payout', selectedPayout?.id],
        queryFn: async () => {
            if (!selectedPayout?.id) return null;
            const res = await api.get(`/payouts/${selectedPayout.id}`);
            return res.data;
        },
        enabled: !!selectedPayout?.id && isDetailOpen
    });

    const { data: payouts, isLoading } = useQuery<{ data: PayoutRequest[] }>({
        queryKey: ['admin', 'payouts', statusFilter],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            // Search query implementation on backend might be generic or specific userId. Assume basic filter for now.
            const res = await api.get('/payouts/admin/all', { params });
            return res.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.post(`/payouts/admin/${id}/approve`);
        },
        onSuccess: () => {
            toast.success('Payout approved');
            queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const rejectMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
            await api.post(`/payouts/admin/${id}/reject`, { reason });
        },
        onSuccess: () => {
            toast.success('Payout rejected');
            setIsRejectOpen(false);
            setRejectReason('');
            queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const markPaidMutation = useMutation({
        mutationFn: async ({ id, fileKey, mimeType, size, ref }: { id: string; fileKey: string; mimeType: string; size: number; ref?: string }) => {
            await api.post(`/payouts/admin/${id}/mark-paid`, {
                receiptFileKey: fileKey,
                mimeType,
                fileSizeBytes: size,
                paymentReference: ref
            });
        },
        onSuccess: () => {
            toast.success('Payout marked as PAID');
            setIsMarkPaidOpen(false);
            setUploadedReceipt(null);
            setPaymentRef('');
            queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleRejectClick = (p: PayoutRequest) => {
        setSelectedPayout(p);
        setIsRejectOpen(true);
    };

    const handleMarkPaidClick = (p: PayoutRequest) => {
        setSelectedPayout(p);
        setIsMarkPaidOpen(true);
    };

    const handleApproveClick = (p: PayoutRequest) => {
        if (confirm(`Approve payout of $${(p.amountCents / 100).toFixed(2)} for ${p.wallet.user.fullName}?`)) {
            approveMutation.mutate(p.id);
        }
    };

    const handleViewDetailsClick = (p: PayoutRequest) => {
        setSelectedPayout(p);
        setIsDetailOpen(true);
    };

    const confirmReject = () => {
        if (selectedPayout && rejectReason) {
            rejectMutation.mutate({ id: selectedPayout.id, reason: rejectReason });
        }
    };

    const confirmMarkPaid = () => {
        if (selectedPayout && uploadedReceipt) {
            markPaidMutation.mutate({
                id: selectedPayout.id,
                fileKey: uploadedReceipt.key,
                mimeType: uploadedReceipt.mimeType,
                size: uploadedReceipt.size,
                ref: paymentRef
            });
        }
    };

    return (
        <div className="space-y-6 container mx-auto py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payout Requests</h1>
                    <p className="text-muted-foreground">Manage worker withdrawals and payments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PAID">Paid</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Worker</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
                            ) : payouts?.data?.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No requests found.</TableCell></TableRow>
                            ) : (
                                payouts?.data?.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{p.wallet.user.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{p.wallet.user.email}</div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold">${(p.amountCents / 100).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                p.status === 'PAID' ? 'default' :
                                                    p.status === 'PENDING' ? 'outline' :
                                                        p.status === 'REJECTED' ? 'destructive' : 'secondary'
                                            }>
                                                {p.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                                    {p.status === 'PENDING' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleApproveClick(p)}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleRejectClick(p)}>
                                                                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    {p.status === 'APPROVED' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleMarkPaidClick(p)}>
                                                                <CheckCircle className="mr-2 h-4 w-4 text-primary" /> Mark as Paid
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleRejectClick(p)}>
                                                                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleViewDetailsClick(p)}>
                                                        <FileText className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Payout Details</DialogTitle>
                        <DialogDescription>
                            Review full details for this request including bank information.
                        </DialogDescription>
                    </DialogHeader>
                    {isDetailLoading || !payoutDetail ? (
                        <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase">Status</span>
                                    <Badge variant="outline" className="mt-1">{payoutDetail.status}</Badge>
                                </div>
                                <div className="text-right">
                                    <span className="text-muted-foreground block text-xs uppercase">Amount</span>
                                    <span className="font-bold text-lg">${(payoutDetail.amountCents / 100).toFixed(2)}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground block text-xs uppercase mb-1">Worker</span>
                                    <div className="font-medium">{payoutDetail.wallet?.user?.fullName}</div>
                                    <div className="text-xs text-muted-foreground">{payoutDetail.wallet?.user?.email}</div>
                                </div>
                                <div className="col-span-2 border-t pt-2 mt-2">
                                    <span className="text-muted-foreground block text-xs uppercase mb-2 font-bold">Bank Details</span>
                                    <div className="bg-slate-50 p-3 rounded-md space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Bank Name</span>
                                            <span className="font-medium">{payoutDetail.wallet?.user?.workerProfile?.bankDetails?.bankName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Account Name</span>
                                            <span className="font-medium">{payoutDetail.wallet?.user?.workerProfile?.bankDetails?.accountName || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Account Number</span>
                                            <span className="font-medium font-mono">****{payoutDetail.wallet?.user?.workerProfile?.bankDetails?.accountNumberLast4 || '****'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Branch Code</span>
                                            <span className="font-medium">{payoutDetail.wallet?.user?.workerProfile?.bankDetails?.branchCode || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                {payoutDetail.rejectionReason && (
                                    <div className="col-span-2 bg-red-50 p-3 rounded-md border border-red-100 text-red-800 text-xs">
                                        <span className="font-bold block mb-1">Rejection Reason:</span>
                                        {payoutDetail.rejectionReason}
                                    </div>
                                )}
                                <div className="col-span-2 text-xs text-muted-foreground pt-2">
                                    Requested on {new Date(payoutDetail.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Close</Button>
                        {payoutDetail?.status === 'PENDING' && (
                            <Button onClick={() => { setIsDetailOpen(false); handleApproveClick(payoutDetail); }}>Approve</Button>
                        )}
                        {payoutDetail?.status === 'APPROVED' && (
                            <Button onClick={() => { setIsDetailOpen(false); handleMarkPaidClick(payoutDetail); }}>Mark Paid</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payout Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this payout. The funds will be returned to the worker's available balance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason || rejectMutation.isPending}>
                            {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mark Paid Dialog */}
            <Dialog open={isMarkPaidOpen} onOpenChange={setIsMarkPaidOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark Payout as Paid</DialogTitle>
                        <DialogDescription>
                            Confirm payment and upload the transaction receipt.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Payment Reference / Transaction ID</label>
                            <Input
                                placeholder="Bank Transaction ID"
                                value={paymentRef}
                                onChange={(e) => setPaymentRef(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Upload Receipt (PDF/Image)</label>
                            {selectedPayout && (
                                <PayoutReceiptUpload
                                    payoutId={selectedPayout.id}
                                    onUploadComplete={(key, mime, size) => setUploadedReceipt({ key, mimeType: mime, size })}
                                />
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMarkPaidOpen(false)}>Cancel</Button>
                        <Button onClick={confirmMarkPaid} disabled={!uploadedReceipt || markPaidMutation.isPending}>
                            {markPaidMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
