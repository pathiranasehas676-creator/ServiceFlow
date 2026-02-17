'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/status-badge';
import { LoadingSkeletonTable } from '@/components/admin/loading-skeleton-table';
import { Search, FileCheck, Eye, Filter } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import { ProofGallery } from '@/components/admin/proofs/proof-gallery';

export default function ProofsPage() {
    const [proofs, setProofs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Gallery state
    const [selectedProof, setSelectedProof] = useState<any | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const loadProofs = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/proofs');
            setProofs(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load proofs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProofs();
    }, []);

    const filteredProofs = proofs.filter((p) => {
        const matchesSearch =
            p.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.worker?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleReview = (proof: any) => {
        setSelectedProof(proof);
        setIsGalleryOpen(true);
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Job Proofs</h1>
                <p className="text-muted-foreground font-medium">Verify work completion evidence before approval.</p>
            </div>

            <Card className="border-none shadow-xl bg-white">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-slate-800">Submission Queue</CardTitle>
                            <div className="flex gap-2">
                                <Badge variant={statusFilter === 'ALL' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('ALL')}>
                                    All
                                </Badge>
                                <Badge variant={statusFilter === 'PENDING' ? 'secondary' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('PENDING')}>
                                    Pending
                                </Badge>
                                <Badge variant={statusFilter === 'APPROVED' ? 'secondary' : 'outline'} className="cursor-pointer" onClick={() => setStatusFilter('APPROVED')}>
                                    Approved
                                </Badge>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                placeholder="Search job or worker..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6">
                            <LoadingSkeletonTable rows={5} columns={5} />
                        </div>
                    ) : filteredProofs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/30">
                            <FileCheck className="h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">No Proofs Found</h3>
                            <p className="text-slate-500">There are no proofs matching your current filters.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="font-bold text-slate-700">Job Details</TableHead>
                                    <TableHead className="font-bold text-slate-700">Worker</TableHead>
                                    <TableHead className="font-bold text-slate-700">Submitted</TableHead>
                                    <TableHead className="font-bold text-slate-700">Status</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProofs.map((proof) => (
                                    <TableRow key={proof.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{proof.job?.title || 'Untitled Job'}</div>
                                            <div className="text-xs text-muted-foreground font-mono">#{proof.jobId.slice(-6)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                    {proof.worker?.fullName?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium">{proof.worker?.fullName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {formatDateTime(proof.submittedAt)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={proof.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shadow-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
                                                onClick={() => handleReview(proof)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ProofGallery
                proof={selectedProof}
                open={isGalleryOpen}
                onClose={() => setIsGalleryOpen(false)}
                onStatusChange={loadProofs}
            />
        </div>
    );
}
