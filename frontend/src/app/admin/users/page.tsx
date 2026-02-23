'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
    Search, User as UserIcon, Shield, AlertTriangle, RefreshCw, Ban,
    CheckCircle2, XCircle, Clock, Mail, Phone, Calendar, ShieldCheck,
    CreditCard, FileCheck, ChevronRight, Loader2, Users, Eye, MapPin, AlignLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    STAFF: 'bg-blue-100 text-blue-800 border-blue-200',
    WORKER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    USER: 'bg-slate-100 text-slate-700 border-slate-200',
};

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    ACTIVE: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Active' },
    SUSPENDED: { icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Suspended' },
    BLACKLISTED: { icon: Ban, color: 'text-red-700', bg: 'bg-red-50 border-red-200', label: 'Blacklisted' },
};

const VERIF_LEVEL_LABEL = (level: number) => {
    if (level >= 3) return { label: 'Fully Verified', color: 'text-emerald-600', icon: '🔒' };
    if (level === 2) return { label: 'ID Verified', color: 'text-blue-600', icon: '🪪' };
    if (level === 1) return { label: 'Email Verified', color: 'text-indigo-500', icon: '📧' };
    return { label: 'Unverified', color: 'text-slate-400', icon: '⚠️' };
};

type ActionType = 'ban' | 'suspend' | 'unsuspend' | null;

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [selected, setSelected] = useState<any | null>(null);
    const [action, setAction] = useState<ActionType>(null);
    const [reason, setReason] = useState('');
    const [profileOpen, setProfileOpen] = useState(false);

    const { data: users = [], isLoading, refetch } = useQuery({
        queryKey: ['admin-users'],
        queryFn: () => api.get('/admin/users'),
    });

    const filtered = (users as any[]).filter((u: any) => {
        const matchSearch = !search ||
            u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase()) ||
            u.phoneNumber?.includes(search);
        const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchStatus = statusFilter === 'ALL' || (u.status || (u.isActive ? 'ACTIVE' : 'SUSPENDED')) === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    const banMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
            api.post(`/admin/users/${id}/blacklist`, { reason }),
        onSuccess: () => {
            toast.error('User has been BANNED from the system', { description: reason });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            closeAction();
        },
        onError: (err: any) => toast.error('Failed to ban user', { description: err.message || 'Elevated auth may be required' }),
    });

    const suspendMutation = useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
            api.post(`/admin/users/${id}/suspend`, { reason }),
        onSuccess: () => {
            toast.warning('User suspended', { description: reason });
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            closeAction();
        },
        onError: (err: any) => toast.error('Failed to suspend user', { description: err.message }),
    });

    const unsuspendMutation = useMutation({
        mutationFn: async ({ id }: { id: string }) => api.post(`/admin/users/${id}/unsuspend`),
        onSuccess: () => {
            toast.success('User reinstated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            closeAction();
        },
        onError: (err: any) => toast.error('Failed to unsuspend user', { description: err.message }),
    });

    const openAction = (user: any, act: ActionType) => {
        setSelected(user);
        setAction(act);
        setReason('');
    };

    const closeAction = () => {
        setAction(null);
        setReason('');
    };

    const executeAction = () => {
        if (!selected) return;
        if (action === 'ban') banMutation.mutate({ id: selected.id, reason });
        else if (action === 'suspend') suspendMutation.mutate({ id: selected.id, reason });
        else if (action === 'unsuspend') unsuspendMutation.mutate({ id: selected.id });
    };

    const isPendingAny = banMutation.isPending || suspendMutation.isPending || unsuspendMutation.isPending;

    const stats = {
        total: (users as any[]).length,
        workers: (users as any[]).filter((u: any) => u.role === 'WORKER').length,
        active: (users as any[]).filter((u: any) => (u.status || 'ACTIVE') === 'ACTIVE').length,
        banned: (users as any[]).filter((u: any) => u.status === 'BLACKLISTED').length,
        fullyVerified: (users as any[]).filter((u: any) => (u.verificationLevel || 0) >= 3).length,
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-[11px] tracking-widest uppercase mb-1">
                        <Users className="h-3.5 w-3.5" />
                        All System Users
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">User Management</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Full visibility and control over every account in the system.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    className="h-10 rounded-xl font-bold border-slate-200"
                >
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total Users', value: stats.total, color: 'bg-slate-900', text: 'text-white' },
                    { label: 'Workers', value: stats.workers, color: 'bg-indigo-600', text: 'text-white' },
                    { label: 'Active', value: stats.active, color: 'bg-emerald-600', text: 'text-white' },
                    { label: 'Banned', value: stats.banned, color: 'bg-red-600', text: 'text-white' },
                    { label: 'Fully Verified', value: stats.fullyVerified, color: 'bg-blue-600', text: 'text-white' },
                ].map(s => (
                    <div key={s.label} className={`${s.color} ${s.text} rounded-2xl p-4 flex flex-col justify-between`}>
                        <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{s.label}</span>
                        <span className="text-3xl font-black leading-none mt-2">{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Name, email or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 rounded-xl border-slate-200 bg-white"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['ALL', 'WORKER', 'STAFF', 'ADMIN', 'USER'].map(r => (
                        <Button
                            key={r}
                            size="sm"
                            variant={roleFilter === r ? 'default' : 'outline'}
                            onClick={() => setRoleFilter(r)}
                            className={cn('h-9 rounded-xl font-bold text-xs', roleFilter === r && 'bg-indigo-600 border-indigo-600')}
                        >
                            {r}
                        </Button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {['ALL', 'ACTIVE', 'SUSPENDED', 'BLACKLISTED'].map(s => (
                        <Button
                            key={s}
                            size="sm"
                            variant={statusFilter === s ? 'default' : 'outline'}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'h-9 rounded-xl font-bold text-xs',
                                statusFilter === s && s === 'BLACKLISTED' && 'bg-red-600 border-red-600',
                                statusFilter === s && s === 'SUSPENDED' && 'bg-amber-500 border-amber-500',
                                statusFilter === s && s === 'ACTIVE' && 'bg-emerald-600 border-emerald-600',
                                statusFilter === s && s === 'ALL' && 'bg-slate-900 border-slate-900',
                            )}
                        >
                            {s}
                        </Button>
                    ))}
                </div>
            </div>

            {/* User Grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-52 bg-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <UserIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-bold text-slate-400">No users found</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((user: any) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onView={() => { setSelected(user); setProfileOpen(true); }}
                            onBan={() => openAction(user, 'ban')}
                            onSuspend={() => openAction(user, 'suspend')}
                            onUnsuspend={() => openAction(user, 'unsuspend')}
                        />
                    ))}
                </div>
            )}

            {/* Confirm Action Dialog */}
            <Dialog open={!!action} onOpenChange={(o) => !o && closeAction()}>
                <DialogContent className="rounded-3xl border-none shadow-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className={cn(
                            'text-xl font-black',
                            action === 'ban' && 'text-red-700',
                            action === 'suspend' && 'text-amber-700',
                            action === 'unsuspend' && 'text-emerald-700',
                        )}>
                            {action === 'ban' && '🔴 Ban User from System'}
                            {action === 'suspend' && '🟡 Suspend User Access'}
                            {action === 'unsuspend' && '🟢 Reinstate User'}
                        </DialogTitle>
                        <DialogDescription className="font-medium text-slate-600">
                            {action === 'ban' && `Permanently ban ${selected?.fullName}. They will lose all system access.`}
                            {action === 'suspend' && `Temporarily suspend ${selected?.fullName}. They won't be able to log in.`}
                            {action === 'unsuspend' && `Restore full access for ${selected?.fullName}.`}
                        </DialogDescription>
                    </DialogHeader>

                    {action !== 'unsuspend' && (
                        <div className="space-y-2 py-2">
                            <Label className="font-bold text-slate-700 text-xs uppercase tracking-wider">
                                {action === 'ban' ? 'Ban' : 'Suspension'} Reason *
                            </Label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={action === 'ban'
                                    ? 'Provide detailed reason for the ban (this is logged)...'
                                    : 'Why is this user being suspended?'}
                                className="rounded-xl resize-none"
                                rows={3}
                            />
                            {action === 'ban' && (
                                <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-700">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span className="font-medium">This action requires elevated permissions and is permanently logged in the audit trail.</span>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={closeAction} className="rounded-xl font-bold">Cancel</Button>
                        <Button
                            className={cn(
                                'rounded-xl font-black px-6',
                                action === 'ban' && 'bg-red-600 hover:bg-red-700',
                                action === 'suspend' && 'bg-amber-500 hover:bg-amber-600',
                                action === 'unsuspend' && 'bg-emerald-600 hover:bg-emerald-700',
                            )}
                            onClick={executeAction}
                            disabled={isPendingAny || (action !== 'unsuspend' && !reason.trim())}
                        >
                            {isPendingAny && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {action === 'ban' && 'Confirm Ban'}
                            {action === 'suspend' && 'Suspend User'}
                            {action === 'unsuspend' && 'Reinstate User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Profile Detail Sheet */}
            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
                    {selected && (
                        <UserProfilePanel
                            user={selected}
                            onBan={() => { setProfileOpen(false); openAction(selected, 'ban'); }}
                            onSuspend={() => { setProfileOpen(false); openAction(selected, 'suspend'); }}
                            onUnsuspend={() => { setProfileOpen(false); openAction(selected, 'unsuspend'); }}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}

function UserCard({ user, onView, onBan, onSuspend, onUnsuspend }: {
    user: any; onView: () => void; onBan: () => void; onSuspend: () => void; onUnsuspend: () => void;
}) {
    const userStatus = user.status || (user.isActive ? 'ACTIVE' : 'SUSPENDED');
    const statusCfg = STATUS_CONFIG[userStatus] || STATUS_CONFIG.ACTIVE;
    const verifMeta = VERIF_LEVEL_BADGE(user.verificationLevel || 0);
    const latestId = user.workerProfile?.idVerifications?.[0];
    const bankVerified = user.workerProfile?.bankDetails?.isVerified;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
            <Card className={cn(
                'border-none shadow-md hover:shadow-xl transition-all rounded-3xl overflow-hidden bg-white',
                userStatus === 'BLACKLISTED' && 'ring-2 ring-red-200',
                userStatus === 'SUSPENDED' && 'ring-2 ring-amber-200',
            )}>
                <div className={cn(
                    'h-1.5 w-full',
                    userStatus === 'ACTIVE' && 'bg-emerald-500',
                    userStatus === 'SUSPENDED' && 'bg-amber-400',
                    userStatus === 'BLACKLISTED' && 'bg-red-500',
                )} />
                <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg',
                                user.role === 'ADMIN' && 'bg-purple-600 text-white',
                                user.role === 'STAFF' && 'bg-blue-600 text-white',
                                user.role === 'WORKER' && 'bg-indigo-600 text-white',
                                user.role === 'USER' && 'bg-slate-200 text-slate-600',
                            )}>
                                {user.fullName?.charAt(0) || '?'}
                            </div>
                            <div>
                                <p className="font-black text-slate-900 leading-tight">{user.fullName}</p>
                                <p className="text-[11px] text-slate-500">{user.email}</p>
                            </div>
                        </div>
                        <div className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border', ROLE_COLORS[user.role] || ROLE_COLORS.USER)}>
                            {user.role}
                        </div>
                    </div>

                    {/* Status + Verification */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-bold', statusCfg.bg, statusCfg.color)}>
                            <statusCfg.icon className="h-3.5 w-3.5" />
                            {statusCfg.label}
                        </div>
                        <div className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-bold', verifMeta.bg, verifMeta.color)}>
                            <span>{verifMeta.icon}</span>
                            {verifMeta.label}
                        </div>
                    </div>

                    {/* ID + Bank indicators */}
                    {user.role === 'WORKER' && (
                        <div className="flex gap-2 text-[10px]">
                            <div className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-lg border font-bold',
                                latestId?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    latestId?.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-slate-500 border-slate-200'
                            )}>
                                <FileCheck className="h-3 w-3" />
                                ID: {latestId?.status || 'None'}
                            </div>
                            <div className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded-lg border font-bold',
                                bankVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                            )}>
                                <CreditCard className="h-3 w-3" />
                                Bank: {bankVerified ? 'Verified' : user.workerProfile?.bankDetails ? 'Pending' : 'None'}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-slate-50">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 rounded-xl font-bold border-slate-200"
                            onClick={onView}
                        >
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                        {userStatus === 'ACTIVE' && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl font-bold border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={onSuspend}
                                >
                                    <Clock className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 rounded-xl font-bold border-red-200 text-red-700 hover:bg-red-50"
                                    onClick={onBan}
                                >
                                    <Ban className="h-3.5 w-3.5" />
                                </Button>
                            </>
                        )}
                        {(userStatus === 'SUSPENDED' || userStatus === 'BLACKLISTED') && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 rounded-xl font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                onClick={onUnsuspend}
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Reinstate
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function UserProfilePanel({ user: initialUser, onBan, onSuspend, onUnsuspend }: {
    user: any; onBan: () => void; onSuspend: () => void; onUnsuspend: () => void;
}) {
    const { data: user = initialUser, isLoading } = useQuery({
        queryKey: ['admin-user-detail', initialUser?.id],
        queryFn: () => api.get(`/admin/users/${initialUser?.id}`),
        enabled: !!initialUser?.id,
    });

    const userStatus = user.status || (user.isActive ? 'ACTIVE' : 'SUSPENDED');
    const statusCfg = STATUS_CONFIG[userStatus] || STATUS_CONFIG.ACTIVE;
    const verifMeta = VERIF_LEVEL_BADGE(user.verificationLevel || 0);
    const latestId = user.workerProfile?.idVerifications?.[0];

    return (
        <div className="flex flex-col h-full">
            {/* Header strip */}
            <div className="bg-slate-900 text-white p-6">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        'h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl',
                        user.role === 'ADMIN' && 'bg-purple-500',
                        user.role === 'STAFF' && 'bg-blue-500',
                        user.role === 'WORKER' && 'bg-indigo-500',
                        user.role === 'USER' && 'bg-slate-500',
                    )}>
                        {user.fullName?.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-black">{user.fullName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black border', ROLE_COLORS[user.role])}>{user.role}</span>
                            <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-black border', statusCfg.bg, statusCfg.color)}>{statusCfg.label}</span>
                        </div>
                    </div>
                    {isLoading && <Loader2 className="ml-auto h-5 w-5 animate-spin text-slate-400" />}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Information</p>
                    <div className="space-y-2">
                        {[
                            { icon: Mail, label: user.email },
                            { icon: Phone, label: user.phoneNumber || 'No phone' },
                            { icon: Calendar, label: user.createdAt ? `Joined ${format(new Date(user.createdAt), 'MMM d, yyyy')}` : '' },
                            user.workerProfile?.address && { icon: MapPin, label: user.workerProfile.address },
                        ].filter(Boolean).map((item: any, i) => (
                            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                                <item.icon className="h-4 w-4 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-800 text-sm whitespace-pre-wrap">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* About / Bio */}
                {user.workerProfile?.bio && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Bio</p>
                        <div className="bg-slate-50 rounded-2xl p-4 flex gap-3">
                            <AlignLeft className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                            <p className="text-sm text-slate-600 leading-relaxed italic">
                                "{user.workerProfile.bio}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Verification */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verification Status</p>
                    <div className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 border', verifMeta.bg, verifMeta.color)}>
                        <ShieldCheck className="h-6 w-6 shrink-0" />
                        <div>
                            <p className="font-black">{verifMeta.label}</p>
                            <p className="text-xs opacity-70">Level {user.verificationLevel || 0} of 3</p>
                        </div>
                    </div>
                    {latestId && (
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest ID Submission</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-slate-500">Type</span>
                                    <p className="font-bold">{latestId.documentType}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Status</span>
                                    <p className={cn('font-bold',
                                        latestId.status === 'APPROVED' && 'text-emerald-600',
                                        latestId.status === 'PENDING' && 'text-amber-600',
                                        latestId.status === 'REJECTED' && 'text-red-600',
                                    )}>{latestId.status}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-500">Submitted</span>
                                    <p className="font-bold">{latestId.submittedAt ? formatDistanceToNow(new Date(latestId.submittedAt), { addSuffix: true }) : '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {user.role === 'WORKER' && (
                        <Link href={`/admin/verifications?search=${user.email}`} className="block">
                            <Button variant="outline" className="w-full h-11 rounded-xl font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                <FileCheck className="mr-2 h-4 w-4" /> View Verification Files
                                <ChevronRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Finances (Quick View) */}
                {user.role === 'WORKER' && user.wallet && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Snapshot</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase">Balance</p>
                                <p className="text-xl font-black text-emerald-700">LKR {user.wallet.balance?.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-blue-600 uppercase">Pending</p>
                                <p className="text-xl font-black text-blue-700">LKR {user.wallet.pendingBalance?.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="border-t bg-white p-6 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Account Actions</p>
                {userStatus === 'ACTIVE' ? (
                    <div className="flex gap-3">
                        <Button
                            className="flex-1 h-12 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={onSuspend}
                        >
                            <Clock className="mr-2 h-4 w-4" /> Suspend
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white"
                            onClick={onBan}
                        >
                            <Ban className="mr-2 h-4 w-4" /> Ban User
                        </Button>
                    </div>
                ) : (
                    <Button
                        className="w-full h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700"
                        onClick={onUnsuspend}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Reinstate User
                    </Button>
                )}
            </div>
        </div>
    );
}

function VERIF_LEVEL_BADGE(level: number) {
    if (level >= 3) return { label: 'Full KYC', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '🔒' };
    if (level === 2) return { label: 'ID Only', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '🪪' };
    if (level === 1) return { label: 'Email', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: '📧' };
    return { label: 'Unverified', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: '⚠️' };
}
