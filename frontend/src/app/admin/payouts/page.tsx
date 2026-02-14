'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/status-badge';
import { LoadingSkeletonTable } from '@/components/admin/loading-skeleton-table';
import { Search, Wallet, Upload, CheckCircle, XCircle, FileText } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Approval Dialog State
    const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadPayouts = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/payouts');
            setPayouts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to load payouts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayouts();
    }, []);

    const handleApproveClick = (payout: any) => {
        setSelectedPayout(payout);
        setIsApproveOpen(true);
        setReceiptFile(null);
    };

    const confirmApproval = async () => {
        if (!selectedPayout) return;

        // In real app, upload file first to presigned url, then send key
        // specific logic depends on backend
        setIsSubmitting(true);
        try {
            // Mock upload
            await new Promise(r => setTimeout(r, 1000));

            await apiClient.patch(`/admin/payouts/${selectedPayout.id}/pay`, {
                receiptReference: receiptFile ? 'receipt-mock-key' : undefined
            });

            toast.success('Payout approved and processed');
            setIsApproveOpen(false);
            loadPayouts();
        } catch (error) {
            toast.error('Failed to approve payout');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPayouts = payouts.filter((p) =>
        p.worker?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.worker?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Financial Operations</h1>
                <p className="text-muted-foreground font-medium">Manage worker payouts and wallet transactions.</p>
            </div>

            <Card className="border-none shadow-xl bg-white">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-slate-800">Payout Requests</CardTitle>
                            <CardDescription>
                                {filteredPayouts.filter(p => p.status === 'PENDING').length} pending requests
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                placeholder="Search worker..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6">
                            <LoadingSkeletonTable rows={5} columns={6} />
                        </div>
                    ) : filteredPayouts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/30">
                            <Wallet className="h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">No Payout Requests</h3>
                            <p className="text-slate-500">No pending payout requests found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="font-bold text-slate-700">Worker</TableHead>
                                    <TableHead className="font-bold text-slate-700">Amount</TableHead>
                                    <TableHead className="font-bold text-slate-700">Method</TableHead>
                                    <TableHead className="font-bold text-slate-700">Requested</TableHead>
                                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayouts.map((payout) => (
                                    <TableRow key={payout.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{payout.worker?.fullName}</div>
                                            <div className="text-xs text-muted-foreground">{payout.worker?.email}</div>
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-slate-900">
                                            {formatCurrency(payout.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-100">
                                                {payout.method || 'BANK_TRANSFER'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {formatDateTime(payout.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={payout.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {payout.status === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                                    onClick={() => handleApproveClick(payout)}
                                                >
                                                    Process
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Payout</DialogTitle>
                        <DialogDescription>
                            Confirm transfer of {selectedPayout && formatCurrency(selectedPayout.amount)} to {selectedPayout?.worker?.fullName}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Transfer Receipt (Optional)</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                <span className="text-xs text-slate-500 font-medium">Click to upload receipt image</span>
                                <Input
                                    type="file"
                                    className="opacity-0 absolute inset-0 cursor-pointer"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            {receiptFile && (
                                <div className="text-xs font-medium text-green-600 flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> {receiptFile.name}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                        <Button onClick={confirmApproval} disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
