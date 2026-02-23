'use client';

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, CheckCheck, MapPin, MessageSquare, AlertTriangle, ShieldCheck, ChevronRight, Loader2, ChevronLeft, UserCheck, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationsPage() {
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('ALL');
    const { notifications, meta, unreadCount, isLoading, markRead, markAllRead } = useNotifications(page);

    const filteredNotifications = filter === 'ALL'
        ? notifications
        : notifications.filter((n: any) => n.type === filter);

    const getIcon = (type: string) => {
        switch (type) {
            case 'JOB_ASSIGNED': return <MapPin className="h-4 w-4 text-indigo-500" />;
            case 'COMMENT_REPLY': return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'PROOF_DECISION': return <ShieldCheck className="h-4 w-4 text-emerald-500" />;
            case 'PAYOUT_STATUS': return <Bell className="h-4 w-4 text-amber-500" />;
            case 'VERIFICATION_STATUS': return <UserCheck className="h-4 w-4 text-teal-500" />;
            case 'TICKET_UPDATE': return <Ticket className="h-4 w-4 text-purple-500" />;
            case 'ADMIN_ALERT_SECURITY':
            case 'SESSION_REVOKED': return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default: return <Bell className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6 pb-24 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Notifications</h1>
                    <p className="text-slate-500 font-medium">Stay updated with your job activities and alerts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-[180px] font-bold border-slate-200">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL" className="font-bold">ALL TYPES</SelectItem>
                            <SelectItem value="JOB_ASSIGNED" className="font-bold">JOB ASSIGNED</SelectItem>
                            <SelectItem value="PROOF_DECISION" className="font-bold">PROOF DECISION</SelectItem>
                            <SelectItem value="PAYOUT_STATUS" className="font-bold">PAYOUT STATUS</SelectItem>
                            <SelectItem value="VERIFICATION_STATUS" className="font-bold">VERIFICATIONS</SelectItem>
                            <SelectItem value="TICKET_UPDATE" className="font-bold">TICKETS</SelectItem>
                            <SelectItem value="COMMENT_REPLY" className="font-bold">REPLIES</SelectItem>
                        </SelectContent>
                    </Select>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllRead()}
                            className="text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold hidden md:flex"
                        >
                            <CheckCheck className="mr-2 h-4 w-4" /> MARK ALL READ
                        </Button>
                    )}
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                            <p className="font-black text-xs tracking-widest uppercase">Syncing alerts...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                                <Bell className="h-10 w-10 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Quiet for now</h3>
                            <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">No notifications found for this selection.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredNotifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "p-6 flex items-start gap-5 transition-all relative group cursor-pointer",
                                        !n.isRead ? "bg-indigo-50/40" : "hover:bg-slate-50/80"
                                    )}
                                    onClick={() => !n.isRead && markRead(n.id)}
                                >
                                    {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600" />}

                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-transform group-hover:scale-110",
                                        !n.isRead ? "bg-white border-indigo-100" : "bg-slate-50 border-slate-200"
                                    )}>
                                        {getIcon(n.type)}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className={cn("text-base font-black", !n.isRead ? "text-slate-900" : "text-slate-600")}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-3">
                                            {n.message}
                                        </p>

                                        {n.entityId && (
                                            <div className="pt-2">
                                                <Button variant="secondary" size="sm" className="h-8 bg-white border border-slate-200 text-indigo-600 font-black text-[10px] tracking-widest px-4 hover:bg-slate-50 rounded-full" asChild>
                                                    <Link href={
                                                        n.entityType === 'JOB' ? `/worker/jobs/${n.entityId}` :
                                                            n.entityType === 'TICKET' ? `/worker/support/${n.entityId}` :
                                                                n.entityType === 'VERIFICATION' || n.entityType === 'BANK_DETAILS' ? '/worker/profile' :
                                                                    '#'
                                                    }>
                                                        INTERACT <ChevronRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {meta?.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="font-black h-10 px-6 rounded-2xl border-2"
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" /> PREV
                    </Button>
                    <span className="font-black text-sm text-slate-900 bg-slate-100 px-4 py-2 rounded-xl">
                        {page} / {meta.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === meta.totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="font-black h-10 px-6 rounded-2xl border-2"
                    >
                        NEXT <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
