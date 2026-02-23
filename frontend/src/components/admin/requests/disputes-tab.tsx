'use client';

import { useState } from 'react';
import { useDisputes, useMarkDisputeInReview, useResolveDispute, type Dispute } from '@/lib/hooks/admin/use-requests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Eye, Loader2, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DisputeDetailDrawer } from './dispute-detail-drawer';

export function DisputesTab() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('OPEN');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

    const { data, isLoading, refetch } = useDisputes({ page, limit: 20, status, q: searchQuery });

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            OPEN: { variant: 'destructive', label: 'Open' },
            IN_REVIEW: { variant: 'default', label: 'In Review' },
            RESOLVED: { variant: 'secondary', label: 'Resolved' },
        };
        const config = variants[status] || { variant: 'outline' as const, label: status };
        return <Badge variant={config.variant} className="font-bold">{config.label}</Badge>;
    };

    return (
        <>
            <Card className="border-none shadow-sm h-full">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-xl font-bold">Job Disputes</CardTitle>
                            <CardDescription>Manage and resolve conflicts between users and workers</CardDescription>
                        </div>
                        <Badge variant="outline" className="h-6 font-bold">{data?.meta?.total || 0} TOTAL</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by job title, opener name, or reason..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 rounded-xl"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="OPEN">Open</SelectItem>
                                <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="all">All Statuses</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : data?.data && data.data.length > 0 ? (
                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="font-bold">Job Title</TableHead>
                                        <TableHead className="font-bold">Opened By</TableHead>
                                        <TableHead className="font-bold">Reason</TableHead>
                                        <TableHead className="font-bold text-center">Status</TableHead>
                                        <TableHead className="font-bold">Created</TableHead>
                                        <TableHead className="text-right font-bold">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((dispute) => (
                                        <TableRow key={dispute.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="font-bold max-w-[200px] truncate py-4">
                                                {dispute.job?.title}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm">{dispute.openedBy?.fullName}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                        {dispute.openedBy?.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[250px] truncate text-slate-600 font-medium italic text-sm">
                                                "{dispute.reason}"
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getStatusBadge(dispute.status)}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-slate-500 uppercase">
                                                {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="rounded-lg font-bold gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-none"
                                                    onClick={() => setSelectedDisputeId(dispute.id)}
                                                >
                                                    <Scale className="h-4 w-4" /> REVIEW
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-20 flex flex-col items-center gap-4 border-2 border-dashed rounded-3xl border-slate-100">
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-slate-200" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-slate-700">No disputes found</h3>
                                <p className="text-sm text-muted-foreground">Everything seems to be running smoothly.</p>
                            </div>
                        </div>
                    )}

                    {data?.meta && data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                PAGE {page} OF {data.meta.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg font-bold border-slate-200"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    PREV
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-lg font-bold border-slate-200"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page >= data.meta.totalPages}
                                >
                                    NEXT
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DisputeDetailDrawer
                disputeId={selectedDisputeId}
                open={!!selectedDisputeId}
                onOpenChange={(open) => !open && setSelectedDisputeId(null)}
                onResolved={() => {
                    setSelectedDisputeId(null);
                    refetch();
                }}
            />
        </>
    );
}
