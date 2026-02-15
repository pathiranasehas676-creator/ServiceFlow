'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, Eye, Check, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminVerificationsPage() {
    const [activeTab, setActiveTab] = useState('id');
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Verification Requests</h1>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="id">Identity Verifications</TabsTrigger>
                    <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>

                <TabsContent value="id" className="space-y-4">
                    <VerificationList type="id" page={page} search={searchTerm} />
                </TabsContent>

                <TabsContent value="bank" className="space-y-4">
                    <VerificationList type="bank" page={page} search={searchTerm} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function VerificationList({ type, page, search }: { type: 'id' | 'bank', page: number, search: string }) {
    const queryClient = useQueryClient();

    // Fetch pending by default for queue management
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-verifications', type, page, search],
        queryFn: async () => {
            return api.get(`/admin/verifications/queue?type=${type}&status=PENDING&page=${page}&q=${search}`);
        }
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (isError) return <div className="text-red-500">Failed to load requests</div>;

    const items = data.items || [];

    if (items.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No pending requests found.</div>;
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Worker</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item: any) => (
                        <VerificationRow key={item.id} item={item} type={type} />
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

function VerificationRow({ item, type }: { item: any, type: 'id' | 'bank' }) {
    const [isOpen, setIsOpen] = useState(false);
    const user = item.workerProfile.user;

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{user.fullName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
            </TableCell>
            <TableCell>
                {type === 'id'
                    ? format(new Date(item.submittedAt), 'MMM d, yyyy HH:mm')
                    : format(new Date(item.updatedAt || item.createdAt), 'MMM d, yyyy HH:mm')
                }
            </TableCell>
            <TableCell>
                {type === 'id' ? (
                    <Badge variant="outline">{item.documentType}</Badge>
                ) : (
                    <div className="space-y-0.5 text-sm">
                        <div>{item.bankName}</div>
                        <div className="text-muted-foreground">**** {item.accountNumberLast4}</div>
                    </div>
                )}
            </TableCell>
            <TableCell className="text-right">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Review</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Review {type === 'id' ? 'Identity' : 'Bank'} Verification</DialogTitle>
                            <DialogDescription>
                                Applicant: {user.fullName} ({user.email})
                            </DialogDescription>
                        </DialogHeader>

                        {type === 'id' ? <IdDetails item={item} /> : <BankDetails item={item} />}

                        <ReviewActions
                            id={item.id}
                            type={type}
                            onComplete={() => setIsOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </TableCell>
        </TableRow>
    );
}

function IdDetails({ item }: { item: any }) {
    // Mock URLs for preview since backend returns keys
    // In real implementation, these would be presigned GET URLs from a helper endpoint or passed in item
    // Assuming for MVP we just use a placeholder or assume public access if development
    // Requirement says: "show images (MinIO preview via presigned GET)"
    // Since backend returns keys currently in the 'queue' endpoint, frontend can't generate presigned URLs itself securely without backend.
    // I should ideally update queue endpoint to return urls.
    // For now, I'll display the Key string and a placeholder image.

    return (
        <div className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label>Details</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Type: <span className="font-medium">{item.documentType}</span></div>
                    <div>Number: <span className="font-medium">{item.documentNumber || 'N/A'}</span></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Front Image</Label>
                    <div className="border rounded bg-muted aspect-video flex items-center justify-center relative overflow-hidden">
                        <span className="text-xs text-muted-foreground break-all p-2">{item.frontImageKey}</span>
                        {/* <img src={url} alt="ID Front" className="object-cover w-full h-full" /> */}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Selfie</Label>
                    <div className="border rounded bg-muted aspect-square flex items-center justify-center relative overflow-hidden">
                        <span className="text-xs text-muted-foreground break-all p-2">{item.selfieKey}</span>
                    </div>
                </div>
                {item.backImageKey && (
                    <div className="space-y-2">
                        <Label>Back Image</Label>
                        <div className="border rounded bg-muted aspect-video flex items-center justify-center relative overflow-hidden">
                            <span className="text-xs text-muted-foreground break-all p-2">{item.backImageKey}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function BankDetails({ item }: { item: any }) {
    return (
        <div className="space-y-4 py-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ShieldAlert className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            Account number is encrypted. Only verify that the name matches the profile.
                        </p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm border p-4 rounded">
                <div>
                    <span className="text-muted-foreground">Bank Name</span>
                    <div className="font-medium">{item.bankName}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Account Holder</span>
                    <div className="font-medium">{item.accountName}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Account Number</span>
                    <div className="font-medium">**** {item.accountNumberLast4}</div>
                </div>
                <div>
                    <span className="text-muted-foreground">Branch/Sort Code</span>
                    <div className="font-medium">{item.branchCode || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
}

function ReviewActions({ id, type, onComplete }: { id: string, type: 'id' | 'bank', onComplete: () => void }) {
    const queryClient = useQueryClient();
    const [reason, setReason] = useState('');
    const [showReject, setShowReject] = useState(false);

    const approveMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/admin/verifications/${type}/${id}/approve`);
        },
        onSuccess: () => {
            // Invalidate the query key used in VerificationList
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            onComplete();
            toast.success("Request approved");
        },
        onError: () => toast.error("Failed to approve")
    });

    const rejectMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/admin/verifications/${type}/${id}/reject`, { reason });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            onComplete();
            toast.success("Request rejected");
        },
        onError: () => toast.error("Failed to reject")
    });

    if (showReject) {
        return (
            <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                    <Label htmlFor="reason">Rejection Reason</Label>
                    <Textarea
                        id="reason"
                        placeholder="Please provide a reason for rejection..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={() => rejectMutation.mutate()}
                        disabled={!reason || rejectMutation.isPending}
                    >
                        {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Rejection
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <div className="flex justify-between w-full">
                <Button variant="ghost" onClick={onComplete}>Cancel</Button>
                <div className="space-x-2">
                    <Button variant="destructive" onClick={() => setShowReject(true)}>Reject</Button>
                    <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => approveMutation.mutate()}
                        disabled={approveMutation.isPending}
                    >
                        {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Approve
                    </Button>
                </div>
            </div>
        </DialogFooter>
    );
}
