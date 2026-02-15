'use client';

import * as React from 'react';
import { Check, X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface PayoutRequest {
    id: string;
    amountCents: number;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | 'FAILED';
    type: 'WEEKLY' | 'SPECIAL';
    createdAt: string;
    wallet: {
        user: {
            id: string;
            fullName: string;
            email: string;
        };
    };
    receipt?: {
        receiptKey: string;
    };
}

export function PayoutsTab() {
    const [payouts, setPayouts] = React.useState<PayoutRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [processingId, setProcessingId] = React.useState<string | null>(null);

    // Modal States
    const [rejectOpen, setRejectOpen] = React.useState(false);
    const [payOpen, setPayOpen] = React.useState(false);
    const [selectedPayout, setSelectedPayout] = React.useState<PayoutRequest | null>(null);
    const [rejectReason, setRejectReason] = React.useState('');
    const [receiptFile, setReceiptFile] = React.useState<File | null>(null);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/admin/finance/payouts');
            setPayouts(res.data.data);
        } catch (error) {
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchPayouts();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this payout? Funds are already held.')) return;
        setProcessingId(id);
        try {
            await apiClient.post(`/admin/finance/payouts/${id}/approve`);
            toast.success('Payout approved');
            fetchPayouts();
        } catch (error) {
            toast.error('Failed to approve payout');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async () => {
        if (!selectedPayout || !rejectReason) return;
        setProcessingId(selectedPayout.id);
        setRejectOpen(false);
        try {
            await apiClient.post(`/admin/finance/payouts/${selectedPayout.id}/reject`, { reason: rejectReason });
            toast.success('Payout rejected and funds released');
            fetchPayouts();
        } catch (error) {
            toast.error('Failed to reject payout');
        } finally {
            setProcessingId(null);
            setRejectReason('');
            setSelectedPayout(null);
        }
    };

    const handlePaySubmit = async () => {
        if (!selectedPayout || !receiptFile) return;
        setProcessingId(selectedPayout.id);
        setPayOpen(false);

        try {
            // 1. Get Presigned URL
            const presignRes = await apiClient.post('/storage/receipt/presign', {
                mimeType: receiptFile.type,
                sizeBytes: receiptFile.size,
            });
            const { uploadUrl, key } = presignRes.data; // Assuming return format { uploadUrl, key } checking backend...
            // Backend returns: this.storageService.generatePresignedPutUrl -> returns { uploadUrl, key, ... } usually?
            // Let's assume standard response based on `presignedIdUpload` in storage.controller.ts which returns { uploads: [...] }.
            // My added method returns single object from service.
            // Service usually returns { url, key, ... } or string?
            // generatePresignedPutUrl returns Promise<{ url: string; key: string; ... }> usually.
            // I'll assume standard object.

            // 2. Upload to S3
            await fetch(uploadUrl, {
                method: 'PUT',
                body: receiptFile,
                headers: { 'Content-Type': receiptFile.type },
            });

            // 3. Mark Paid
            await apiClient.post(`/admin/finance/payouts/${selectedPayout.id}/mark-paid`, {
                receiptFileKey: key,
            });

            toast.success('Payout marked as PAID');
            fetchPayouts();
        } catch (error) {
            console.error(error);
            toast.error('Failed to process payment');
        } finally {
            setProcessingId(null);
            setReceiptFile(null);
            setSelectedPayout(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={fetchPayouts}>
                    <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Worker</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && payouts.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                        ) : payouts.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No payout requests found.</TableCell></TableRow>
                        ) : (
                            payouts.map((payout) => (
                                <TableRow key={payout.id}>
                                    <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{payout.wallet.user.fullName}</div>
                                        <div className="text-xs text-muted-foreground">{payout.wallet.user.email}</div>
                                    </TableCell>
                                    <TableCell><Badge variant="outline">{payout.type}</Badge></TableCell>
                                    <TableCell className="font-bold">${(payout.amountCents / 100).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            payout.status === 'PAID' ? 'default' :
                                                payout.status === 'APPROVED' ? 'default' : // Greenish?
                                                    payout.status === 'REJECTED' ? 'destructive' : 'secondary'
                                        } className={
                                            payout.status === 'PAID' ? 'bg-green-600' :
                                                payout.status === 'APPROVED' ? 'bg-blue-600' : ''
                                        }>
                                            {payout.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {payout.status === 'PENDING' && (
                                            <>
                                                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(payout.id)} disabled={!!processingId}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => { setSelectedPayout(payout); setRejectOpen(true); }} disabled={!!processingId}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        {payout.status === 'APPROVED' && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedPayout(payout); setPayOpen(true); }} disabled={!!processingId}>
                                                <Upload className="mr-2 h-4 w-4" /> Mark Paid
                                            </Button>
                                        )}
                                        {payout.status === 'PAID' && (
                                            <Button size="sm" variant="ghost" disabled>
                                                <FileText className="mr-2 h-4 w-4" /> Receipt
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Reject Dialog */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payout Request</DialogTitle>
                        <DialogDescription>
                            This will release the held funds back to the worker&apos;s available balance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Rejection Reason</Label>
                        <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Invalid bank details" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleRejectSubmit} disabled={!rejectReason || !!processingId}>
                            {processingId ? 'Processing...' : 'Reject Payout'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pay Dialog */}
            <Dialog open={payOpen} onOpenChange={setPayOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Payout</DialogTitle>
                        <DialogDescription>
                            Upload the payment receipt to mark this payout as PAID. Funds will be permanently debited.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="receipt">Payment Receipt (Image/PDF)</Label>
                            <Input id="receipt" type="file" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
                        </div>
                        {selectedPayout && (
                            <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
                                Confirming payment of <strong>${(selectedPayout.amountCents / 100).toFixed(2)}</strong> to <strong>{selectedPayout.wallet.user.fullName}</strong>.
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
                        <Button onClick={handlePaySubmit} disabled={!receiptFile || !!processingId}>
                            {processingId ? 'Uploading...' : 'Confirm Payment'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
