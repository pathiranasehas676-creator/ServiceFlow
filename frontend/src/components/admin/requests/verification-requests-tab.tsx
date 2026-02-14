'use client';

import { useState } from 'react';
import { useVerificationRequests, useApproveVerification, useRejectVerification, type VerificationRequest } from '@/lib/hooks/admin/use-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Eye, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export function VerificationRequestsTab() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
    const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [note, setNote] = useState('');

    const { data, isLoading, refetch } = useVerificationRequests({ page, limit: 20, status, q: searchQuery });
    const approveVerification = useApproveVerification();
    const rejectVerification = useRejectVerification();

    const handleApprove = async () => {
        if (!selectedVerification) return;
        await approveVerification.mutateAsync({ verificationId: selectedVerification.id, note });
        setActionDialog(null);
        setSelectedVerification(null);
        setNote('');
        refetch();
    };

    const handleReject = async () => {
        if (!selectedVerification || !rejectionReason.trim()) return;
        await rejectVerification.mutateAsync({ verificationId: selectedVerification.id, reason: rejectionReason, note });
        setActionDialog(null);
        setSelectedVerification(null);
        setRejectionReason('');
        setNote('');
        refetch();
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            PENDING: { variant: 'default', label: 'Pending Review' },
            APPROVED: { variant: 'secondary', label: 'Approved' },
            REJECTED: { variant: 'destructive', label: 'Rejected' },
        };
        const config = variants[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>ID Verification Requests</CardTitle>
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
                                <SelectItem value="PENDING">Pending Review</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
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
                                        <TableHead>Document Type</TableHead>
                                        <TableHead>Document Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((verification) => (
                                        <TableRow key={verification.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{verification.workerProfile?.user?.fullName || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">{verification.workerProfile?.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{verification.documentType}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {verification.documentNumber || 'N/A'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(verification.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(verification.submittedAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedVerification(verification)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {verification.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedVerification(verification);
                                                                    setActionDialog('approve');
                                                                }}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedVerification(verification);
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
                            No verification requests found
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
            <Dialog open={!!selectedVerification && !actionDialog} onOpenChange={(open) => !open && setSelectedVerification(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>ID Verification Details</DialogTitle>
                    </DialogHeader>
                    {selectedVerification && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Worker</Label>
                                    <p className="font-medium">{selectedVerification.workerProfile?.user?.fullName}</p>
                                    <p className="text-sm text-muted-foreground">{selectedVerification.workerProfile?.user?.email}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Document Type</Label>
                                    <Badge variant="outline" className="mt-1">{selectedVerification.documentType}</Badge>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Document Number</Label>
                                    <p className="font-mono">{selectedVerification.documentNumber || 'Not provided'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedVerification.status)}</div>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">ID Documents</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-muted p-2 text-sm font-medium">Front</div>
                                        <div className="aspect-video bg-muted/50 flex items-center justify-center">
                                            <FileText className="h-12 w-12 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground mt-2">{selectedVerification.frontImageKey}</p>
                                        </div>
                                    </div>
                                    {selectedVerification.backImageKey && (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="bg-muted p-2 text-sm font-medium">Back</div>
                                            <div className="aspect-video bg-muted/50 flex items-center justify-center">
                                                <FileText className="h-12 w-12 text-muted-foreground" />
                                                <p className="text-xs text-muted-foreground mt-2">{selectedVerification.backImageKey}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Note: Actual images would be loaded from storage using signed URLs
                                </p>
                            </div>
                            {selectedVerification.rejectionReason && (
                                <div>
                                    <Label className="text-muted-foreground">Rejection Reason</Label>
                                    <p className="mt-1 text-destructive">{selectedVerification.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        {selectedVerification?.status === 'PENDING' && (
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
                        <DialogTitle>Approve ID Verification</DialogTitle>
                        <DialogDescription>
                            This will approve the worker's ID verification and update their profile status.
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
                        <Button onClick={handleApprove} disabled={approveVerification.isPending}>
                            {approveVerification.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={actionDialog === 'reject'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject ID Verification</DialogTitle>
                        <DialogDescription>
                            Please provide a clear reason for rejection. The worker will be able to resubmit.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject-reason">Rejection Reason *</Label>
                            <Textarea
                                id="reject-reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g., Document is blurry, expired, or does not match profile..."
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
                            disabled={!rejectionReason.trim() || rejectVerification.isPending}
                        >
                            {rejectVerification.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
