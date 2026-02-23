'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
    Loader2, Search, Eye, CheckCircle2, XCircle, ShieldAlert, Zap,
    User, Clock, FileCheck, Camera, CreditCard, BadgeCheck, AlertTriangle,
    ChevronRight, ExternalLink, Ban, Check, X, Phone, Mail, Calendar,
    Shield, MapPin, AlignLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Pending Review', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    APPROVED: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    REJECTED: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    NOT_SUBMITTED: { label: 'Not Submitted', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

export default function AdminVerificationsPage() {
    const [activeTab, setActiveTab] = useState<'id' | 'bank'>('id');
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<any | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const { data: idVerifs = [], isLoading: idLoading, refetch: refetchId } = useQuery({
        queryKey: ['admin-verifications', 'id', statusFilter],
        queryFn: () => api.get(`/admin/verifications?status=${statusFilter}`),
    });

    const { data: bankVerifs = [], isLoading: bankLoading, refetch: refetchBank } = useQuery({
        queryKey: ['admin-verifications', 'bank', statusFilter],
        queryFn: () => api.get(`/admin/verifications/bank`),
    });

    const filteredId = (idVerifs as any[]).filter((v: any) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            v.user?.fullName?.toLowerCase().includes(s) ||
            v.user?.email?.toLowerCase().includes(s) ||
            v.documentNumber?.toLowerCase().includes(s)
        );
    });

    const filteredBank = (bankVerifs as any[]).filter((v: any) => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            v.workerProfile?.user?.fullName?.toLowerCase().includes(s) ||
            v.workerProfile?.user?.email?.toLowerCase().includes(s)
        );
    });

    const currentList = activeTab === 'id' ? filteredId : filteredBank;
    const isLoading = activeTab === 'id' ? idLoading : bankLoading;

    const openDetail = (item: any) => {
        setSelected(item);
        setSheetOpen(true);
    };

    const counts = {
        pending: (idVerifs as any[]).filter((v: any) => v.status === 'PENDING').length,
        approved: (idVerifs as any[]).filter((v: any) => v.status === 'APPROVED').length,
        rejected: (idVerifs as any[]).filter((v: any) => v.status === 'REJECTED').length,
        bankPending: (bankVerifs as any[]).filter((v: any) => !v.isVerified).length,
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[11px] tracking-widest uppercase mb-1">
                        <Shield className="h-3.5 w-3.5 fill-indigo-600" />
                        Identity & KYC Management
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Verification Hub</h1>
                    <p className="text-slate-500 text-base font-medium mt-1">
                        Review, approve, or reject submitted identity and bank documents.
                    </p>
                </div>

                {/* Stats row */}
                <div className="flex gap-3 flex-wrap">
                    {[
                        { label: 'Pending ID', value: counts.pending, color: 'bg-amber-500' },
                        { label: 'Approved', value: counts.approved, color: 'bg-emerald-500' },
                        { label: 'Rejected', value: counts.rejected, color: 'bg-red-500' },
                        { label: 'Bank Pending', value: counts.bankPending, color: 'bg-blue-500' },
                    ].map(s => (
                        <div key={s.label} className="flex items-center gap-2 bg-white border border-slate-100 shadow-sm rounded-2xl px-4 py-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.label}</span>
                            <span className="text-lg font-black text-slate-900 leading-none">{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, email or doc number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-slate-200"
                    />
                </div>
                <div className="flex gap-2">
                    {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
                        <Button
                            key={s}
                            size="sm"
                            variant={statusFilter === s ? 'default' : 'outline'}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'h-9 rounded-xl font-bold text-xs uppercase tracking-wider',
                                statusFilter === s && s === 'PENDING' && 'bg-amber-500 hover:bg-amber-600 border-amber-500',
                                statusFilter === s && s === 'APPROVED' && 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600',
                                statusFilter === s && s === 'REJECTED' && 'bg-red-600 hover:bg-red-700 border-red-600',
                            )}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'id' | 'bank')}>
                <TabsList className="bg-slate-100 rounded-2xl p-1 h-12">
                    <TabsTrigger value="id" className="rounded-xl font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileCheck className="h-4 w-4 mr-2" /> Identity Documents
                        {counts.pending > 0 && <span className="ml-2 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{counts.pending}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="bank" className="rounded-xl font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <CreditCard className="h-4 w-4 mr-2" /> Bank Details
                        {counts.bankPending > 0 && <span className="ml-2 bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{counts.bankPending}</span>}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="id" className="mt-6">
                    <VerificationGrid
                        items={filteredId}
                        isLoading={isLoading}
                        type="id"
                        onSelect={openDetail}
                    />
                </TabsContent>
                <TabsContent value="bank" className="mt-6">
                    <VerificationGrid
                        items={filteredBank.map((b: any) => ({ ...b, user: b.workerProfile?.user, status: b.isVerified ? 'APPROVED' : 'PENDING' }))}
                        isLoading={isLoading}
                        type="bank"
                        onSelect={openDetail}
                    />
                </TabsContent>
            </Tabs>

            {/* Detail Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0" side="right">
                    {selected && (
                        <DetailPanel
                            item={selected}
                            type={activeTab}
                            onClose={() => setSheetOpen(false)}
                            onRefresh={() => { refetchId(); refetchBank(); setSheetOpen(false); }}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function VerificationGrid({ items, isLoading, type, onSelect }: { items: any[]; isLoading: boolean; type: 'id' | 'bank'; onSelect: (item: any) => void }) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <BadgeCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-lg font-bold text-slate-400">No verifications found</p>
                <p className="text-sm text-slate-400 mt-1">Try changing the status filter above</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item: any, i: number) => (
                <VerificationCard key={item.id || i} item={item} type={type} onClick={() => onSelect(item)} />
            ))}
        </div>
    );
}

function VerificationCard({ item, type, onClick }: { item: any; type: 'id' | 'bank'; onClick: () => void }) {
    const user = item.user || item.workerProfile?.user;
    const status = item.status || (item.isVerified ? 'APPROVED' : 'PENDING');
    const statusMeta = STATUS_LABELS[status] || STATUS_LABELS.PENDING;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ duration: 0.2 }}
        >
            <Card
                className="border-none shadow-md hover:shadow-xl transition-all rounded-3xl overflow-hidden bg-white cursor-pointer group"
                onClick={onClick}
            >
                {/* Status strip */}
                <div className={cn(
                    'h-1.5 w-full',
                    status === 'PENDING' && 'bg-amber-400',
                    status === 'APPROVED' && 'bg-emerald-500',
                    status === 'REJECTED' && 'bg-red-500',
                )} />
                <CardContent className="p-6 space-y-4">
                    {/* User info */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
                                {user?.fullName?.charAt(0) || '?'}
                            </div>
                            <div>
                                <p className="font-black text-slate-900 leading-tight">{user?.fullName || 'Unknown User'}</p>
                                <p className="text-[11px] text-slate-500 font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <div className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border', statusMeta.bg, statusMeta.color)}>
                            {statusMeta.label}
                        </div>
                    </div>

                    {/* Details */}
                    {type === 'id' ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <span className="text-slate-500 font-medium">Document</span>
                                <span className="font-bold text-slate-800">{item.documentType || 'ID Card'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <span className="text-slate-500 font-medium">ID Number</span>
                                <span className="font-mono font-bold text-slate-800">{item.documentNumber || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <span className="text-slate-500 font-medium">Submitted</span>
                                <span className="font-bold text-slate-800 text-xs">
                                    {item.submittedAt ? formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true }) : '—'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <span className="text-slate-500 font-medium">Bank</span>
                                <span className="font-bold text-slate-800">{item.bankName || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                                <span className="text-slate-500 font-medium">Account</span>
                                <span className="font-mono font-bold text-slate-800">**** {item.accountNumberLast4 || '????'}</span>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <Button className="w-full h-10 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all group-hover:bg-indigo-600" size="sm">
                        Review Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function DetailPanel({ item, type, onClose, onRefresh }: { item: any; type: 'id' | 'bank'; onClose: () => void; onRefresh: () => void }) {
    const queryClient = useQueryClient();
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const user = item.user || item.workerProfile?.user;
    const status = item.status || (item.isVerified ? 'APPROVED' : 'PENDING');
    const statusMeta = STATUS_LABELS[status] || STATUS_LABELS.PENDING;
    const isPending = status === 'PENDING';

    const approveMutation = useMutation({
        mutationFn: async () => {
            if (type === 'id') {
                return api.post(`/admin/verifications/id/${item.id}/approve`, { notes: adminNotes });
            } else {
                return api.post(`/admin/verifications/bank/${item.id}/approve`);
            }
        },
        onSuccess: () => {
            toast.success('Verification approved!', { description: `${user?.fullName}'s ${type === 'id' ? 'identity' : 'bank details'} have been verified.` });
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            onRefresh();
        },
        onError: (err: any) => toast.error('Failed to approve', { description: err.message }),
    });

    const rejectMutation = useMutation({
        mutationFn: async () => {
            if (type === 'id') {
                return api.post(`/admin/verifications/id/${item.id}/reject`, { reason: rejectReason });
            } else {
                return api.post(`/admin/verifications/bank/${item.id}/reject`, { reason: rejectReason });
            }
        },
        onSuccess: () => {
            toast.error('Verification rejected', { description: rejectReason });
            queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
            onRefresh();
        },
        onError: (err: any) => toast.error('Failed to reject', { description: err.message }),
    });

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="bg-slate-900 text-white px-6 pb-5 pt-6 space-y-1 text-left">
                <div className="flex items-center justify-between">
                    <SheetTitle className="text-xl font-black text-white">
                        {type === 'id' ? 'Identity Review' : 'Bank Verification Review'}
                    </SheetTitle>
                    <div className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border', statusMeta.bg, statusMeta.color)}>
                        {statusMeta.label}
                    </div>
                </div>
                <SheetDescription className="text-slate-400 font-medium">
                    Submitted by {user?.fullName} · Case ID: <span className="font-mono text-xs">{item.id?.slice(0, 8)}...</span>
                </SheetDescription>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Profile Card */}
                <Card className="border-none bg-slate-50 rounded-2xl">
                    <CardContent className="p-5 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Applicant Profile</p>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-200">
                                {user?.fullName?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-slate-900 text-lg">{user?.fullName}</p>
                                <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                                    <Mail className="h-3.5 w-3.5" />
                                    <span>{user?.email}</span>
                                </div>
                                {user?.phoneNumber && (
                                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                                        <Phone className="h-3.5 w-3.5" />
                                        <span>{user.phoneNumber}</span>
                                    </div>
                                )}
                                {item.workerProfile?.address && (
                                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-0.5">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="line-clamp-1 italic">{item.workerProfile.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {item.workerProfile?.bio && (
                            <div className="bg-white rounded-xl p-3 border border-slate-100 flex gap-2">
                                <AlignLeft className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-500 italic line-clamp-2">"{item.workerProfile.bio}"</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 mt-3">
                            <div className="bg-white rounded-xl px-3 py-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Account Status</p>
                                <p className={cn('font-black text-sm mt-0.5', user?.status === 'ACTIVE' ? 'text-emerald-600' : 'text-red-600')}>
                                    {user?.status || 'ACTIVE'}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl px-3 py-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Joined</p>
                                <p className="font-black text-sm mt-0.5 text-slate-800">
                                    {user?.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ID Details */}
                {type === 'id' ? (
                    <div className="space-y-5">
                        <div className="bg-slate-50 rounded-2xl p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Document Information</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-xl px-3 py-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Document Type</p>
                                    <p className="font-black text-slate-900 mt-0.5">{item.documentType || '—'}</p>
                                </div>
                                <div className="bg-white rounded-xl px-3 py-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Document Number</p>
                                    <p className="font-black font-mono text-slate-900 mt-0.5">{item.documentNumber || 'NOT PROVIDED'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Document Images */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Submitted Documents</p>
                            <div className="grid grid-cols-2 gap-4">
                                {item.urls?.front && <DocImage label="ID Front" url={item.urls.front} />}
                                {item.urls?.back && <DocImage label="ID Back" url={item.urls.back} />}
                                {item.urls?.selfie && <DocImage label="Selfie Match" url={item.urls.selfie} circular />}
                                {item.urls?.liveness && <DocImage label="Liveness Check" url={item.urls.liveness} isLiveness />}
                            </div>
                            {!item.urls?.front && (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Eye className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-400 font-medium text-sm">Documents are stored securely</p>
                                    <p className="text-slate-400 text-xs mt-1">URLs expire after 2 minutes for security</p>
                                </div>
                            )}
                        </div>

                        {/* Admin Notes */}
                        {isPending && (
                            <div className="space-y-2">
                                <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">Admin Notes (optional)</Label>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Internal notes visible to admin team only..."
                                    className="rounded-xl resize-none"
                                    rows={2}
                                />
                            </div>
                        )}

                        {item.rejectionReason && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black text-red-800 text-sm">Rejection Reason</p>
                                    <p className="text-red-700 text-sm mt-1">{item.rejectionReason}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                            <p className="text-amber-800 text-sm font-medium">Account numbers are encrypted. Verify that the account holder name matches the identity documents.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Bank Name', value: item.bankName },
                                { label: 'Account Holder', value: item.accountName },
                                { label: 'Last 4 Digits', value: `**** ${item.accountNumberLast4 || '????'}` },
                                { label: 'Branch Code', value: item.branchCode || 'N/A' },
                            ].map(f => (
                                <div key={f.label} className="bg-slate-50 rounded-xl px-3 py-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{f.label}</p>
                                    <p className="font-bold text-slate-900 mt-0.5">{f.value || '—'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            {isPending && (
                <div className="border-t bg-white p-6 space-y-3">
                    {showRejectForm ? (
                        <div className="space-y-3">
                            <Label className="font-bold text-slate-800">Rejection Reason *</Label>
                            <Textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Explain clearly why this verification is being rejected..."
                                className="rounded-xl resize-none"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowRejectForm(false)} className="flex-1 rounded-xl">
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1 rounded-xl font-bold"
                                    onClick={() => rejectMutation.mutate()}
                                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                                >
                                    {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <X className="mr-1 h-4 w-4" /> Confirm Rejection
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl border-red-200 text-red-700 hover:bg-red-50 font-bold"
                                onClick={() => setShowRejectForm(true)}
                            >
                                <X className="mr-2 h-4 w-4" /> Reject
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg shadow-emerald-200"
                                onClick={() => approveMutation.mutate()}
                                disabled={approveMutation.isPending}
                            >
                                {approveMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Approve & Verify
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DocImage({ label, url, circular, isLiveness }: { label: string; url: string; circular?: boolean; isLiveness?: boolean }) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                {isLiveness ? <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> : <Eye className="h-3.5 w-3.5 text-indigo-500" />}
                {label}
            </p>
            <div className={cn(
                'relative bg-slate-100 border-2 border-slate-200 overflow-hidden group shadow-inner',
                circular ? 'aspect-square rounded-full max-w-[160px] mx-auto' : 'aspect-video rounded-2xl',
            )}>
                <img src={url} alt={label} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
                >
                    <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                        <ExternalLink className="h-4 w-4" />
                        Full Size
                    </div>
                </a>
            </div>
        </div>
    );
}
