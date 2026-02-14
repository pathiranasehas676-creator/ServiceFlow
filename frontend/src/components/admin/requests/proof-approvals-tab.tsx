'use client';

import { useState } from 'react';
import { useProofRequests, useApproveProof, useRejectProof, type ProofRequest } from '@/lib/hooks/admin/use-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Eye, CheckCircle, XCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function ProofApprovalsTab() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('PROOF_SUBMITTED');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProof, setSelectedProof] = useState<ProofRequest | null>(null);
    const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [note, setNote] = useState('');

    const { data, isLoading, refetch } = useProofRequests({ page, limit: 20, status, q: searchQuery });
    const approveProof = useApproveProof();
    const rejectProof = useRejectProof();

    const handleApprove = async () => {
        if (!selectedProof) return;
        await approveProof.mutateAsync({ jobId: selectedProof.id, note });
        setActionDialog(null);
        setSelectedProof(null);
        setNote('');
        refetch();
    };

    const handleReject = async () => {
        if (!selectedProof || !rejectionReason.trim()) return;
        await rejectProof.mutateAsync({ jobId: selectedProof.id, reason: rejectionReason, note });
        setActionDialog(null);
        setSelectedProof(null);
        setRejectionReason('');
        setNote('');
        refetch();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            PROOF_SUBMITTED: { variant: 'default', label: 'Pending Review' },
            APPROVED: { variant: 'secondary', label: 'Approved' },
            COMPLETED: { variant: 'secondary', label: 'Completed' },
        };
        const config = variants[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Job Proof Approvals</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by job title, worker name, or email..."
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
                                <SelectItem value="PROOF_SUBMITTED">Pending Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
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
                                        <TableHead>Job</TableHead>
                                        <TableHead>Worker</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Proofs</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((proof) => (
                                        <TableRow key={proof.id}>
                                            <TableCell className="font-medium max-w-[200px] truncate">
                                                {proof.title}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{proof.worker?.user?.fullName || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">{proof.worker?.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{proof.service?.name}</TableCell>
                                            <TableCell>${(proof.priceCents / 100).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <ImageIcon className="h-4 w-4" />
                                                    <span>{proof.proofs?.length || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(proof.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(proof.updatedAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedProof(proof)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {proof.status === 'PROOF_SUBMITTED' && (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedProof(proof);
                                                                    setActionDialog('approve');
                                                                }}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedProof(proof);
                                                                    setActionDialog('reject');
                                                                }}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
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
                            No proof requests found
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
            <Dialog open={!!selectedProof && !actionDialog} onOpenChange={(open) => !open && setSelectedProof(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Job Proof Details</DialogTitle>
                        <DialogDescription>{selectedProof?.title}</DialogDescription>
                    </DialogHeader>
                    {selectedProof && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Worker</Label>
                                    <p className="font-medium">{selectedProof.worker?.user?.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{selectedProof.worker?.user?.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Service</Label>
                                    <p className="font-medium">{selectedProof.service?.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Amount</Label>
                                    <p className="font-medium">${(selectedProof.priceCents / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedProof.status)}</div>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Description</Label>
                                <p className="mt-1">{selectedProof.description}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Proof Images ({selectedProof.proofs?.length || 0})</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    {selectedProof.proofs?.map((proof) => (
                                        <div key={proof.id} className="border rounded-lg overflow-hidden">
                                            <img
                                                src={proof.imageUrl || '/placeholder.png'}
                                                alt={proof.caption || 'Proof image'}
                                                className="w-full h-48 object-cover"
                                            />
                                            {proof.caption && (
                                                <p className="p-2 text-sm text-muted-foreground">{proof.caption}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {selectedProof?.status === 'PROOF_SUBMITTED' && (
                            <>
                                <Button variant="outline" onClick={() => setActionDialog('reject')}>
                                    Reject
                                </Button>
                                <Button onClick={() => setActionDialog('approve')}>
                                    Approve
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={actionDialog === 'approve'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Proof</DialogTitle>
                        <DialogDescription>
                            This will approve the job proof and credit the worker's wallet.
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
                        <Button onClick={handleApprove} disabled={approveProof.isPending}>
                            {approveProof.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={actionDialog === 'reject'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Proof</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejection. The worker will be able to resubmit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject-reason">Rejection Reason *</Label>
                            <Textarea
                                id="reject-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explain why the proof is being rejected..."
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
                            disabled={!rejectionReason.trim() || rejectProof.isPending}
                        >
                            {rejectProof.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
