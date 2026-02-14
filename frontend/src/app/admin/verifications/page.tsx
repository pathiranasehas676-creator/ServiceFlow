'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/status-badge';
import { LoadingSkeletonTable } from '@/components/admin/loading-skeleton-table';
import { Search, CheckCircle, Eye, ShieldCheck, Trash2, ArrowRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { VerificationDrawer } from '@/components/admin/verifications/verification-drawer';

export default function VerificationsPage() {
    const [verifications, setVerifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Drawer state
    const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const loadVerifications = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/verifications');
            setVerifications(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to load verifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVerifications();
    }, []);

    const filteredVerifications = verifications.filter((v) =>
        v.worker?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.worker?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredVerifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredVerifications.map(v => v.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkApprove = async () => {
        if (!confirm(`Approve ${selectedIds.length} verifications?`)) return;
        setActionLoading(true);
        try {
            await apiClient.post('/admin/verifications/bulk-approve', { ids: selectedIds });
            toast.success(`Successfully approved ${selectedIds.length} verifications`);
            setSelectedIds([]);
            loadVerifications();
        } catch (error) {
            toast.error('Bulk approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReview = (verification: any) => {
        setSelectedVerification(verification);
        setIsDrawerOpen(true);
    };

    return (
        <div className="space-y-6 relative pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Worker Trust Center</h1>
                <p className="text-muted-foreground font-medium">Identity verification pipeline and document governance.</p>
            </div>

            <Card className="border-none shadow-2xl bg-white overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-slate-800">Review Queue</CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                {filteredVerifications.length} items requiring manual validation
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-96">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                placeholder="Filter by name, email or ID hash..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-white border-slate-200 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6">
                            <LoadingSkeletonTable rows={8} columns={6} />
                        </div>
                    ) : filteredVerifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-50/30">
                            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 text-indigo-500">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Pipeline Clear</h3>
                            <p className="text-slate-500 max-w-xs mx-auto">All worker identities have been verified or rejected. No pending items.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-12 px-6">
                                        <Checkbox
                                            checked={selectedIds.length === filteredVerifications.length && filteredVerifications.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-slate-300"
                                        />
                                    </TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Worker Identity</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Submission Time</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Documents</TableHead>
                                    <TableHead className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Security Status</TableHead>
                                    <TableHead className="text-right px-6 font-bold text-slate-700 uppercase tracking-wider text-[10px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVerifications.map((verification) => (
                                    <TableRow
                                        key={verification.id}
                                        className={`border-slate-100 transition-colors ${selectedIds.includes(verification.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}
                                    >
                                        <TableCell className="px-6">
                                            <Checkbox
                                                checked={selectedIds.includes(verification.id)}
                                                onCheckedChange={() => toggleSelect(verification.id)}
                                                className="border-slate-300"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col py-1">
                                                <span className="font-bold text-slate-900 text-sm">{verification.worker?.fullName}</span>
                                                <span className="text-[11px] text-muted-foreground font-mono">{verification.worker?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[11px] font-medium text-slate-600">
                                            {formatDateTime(verification.submittedAt)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-100 flex items-center gap-1.5 w-fit shadow-sm font-bold text-[10px]">
                                                <ShieldCheck className="h-3 w-3" /> ID_PASS_VERIFIED
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={verification.status} />
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 group hover:bg-indigo-600 hover:text-white transition-all"
                                                onClick={() => handleReview(verification)}
                                            >
                                                <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                                <span className="font-bold">REVIEW</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-slate-950 text-white px-8 py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-10 border border-white/20 backdrop-blur-md">
                        <div className="flex items-center gap-4 pr-10 border-r border-white/10">
                            <span className="bg-indigo-500 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg ring-4 ring-indigo-500/20">
                                {selectedIds.length}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-sm font-black tracking-tight uppercase">Bulk Operations</span>
                                <span className="text-[10px] text-white/50 font-medium font-mono">ENCRYPTED_SESSION_ACTIVE</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white/70 hover:text-white hover:bg-white/10 font-bold text-xs"
                                onClick={() => setSelectedIds([])}
                            >
                                CANCEL
                            </Button>
                            <Button
                                variant="destructive"
                                size="default"
                                className="px-6 flex items-center gap-2 font-black text-xs h-11"
                                disabled={actionLoading}
                            >
                                <Trash2 className="h-4 w-4" /> REJECT BATCH
                            </Button>
                            <Button
                                size="default"
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 flex items-center gap-2 font-black text-xs h-11 shadow-lg shadow-indigo-500/30"
                                onClick={handleBulkApprove}
                                disabled={actionLoading}
                            >
                                <CheckCircle className="h-4 w-4" /> APPROVE SELECTION
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <VerificationDrawer
                verification={selectedVerification}
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onStatusChange={loadVerifications}
            />
        </div>
    );
}
