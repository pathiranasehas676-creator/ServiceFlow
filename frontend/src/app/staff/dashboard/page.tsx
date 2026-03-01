'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Briefcase, FileCheck, LifeBuoy, PlusCircle,
    TrendingUp, Users, AlertCircle, Clock,
    ArrowRight, Activity, Zap, MapPin, Search, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';
import { useStaffStats } from '@/lib/hooks/staff/use-staff-stats';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function StaffDashboard() {
    const { user, hasPermission } = useAuth();
    const { stats, auditLogs, isLoading } = useStaffStats();

    const opsStats = [
        { label: 'Active Fleet', value: stats?.onlineWorkers ?? 0, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending Proofs', value: stats?.pendingProofs ?? 0, icon: FileCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Open Tickets', value: stats?.openTickets ?? 0, icon: LifeBuoy, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'ID Verifs', value: stats?.pendingIdVerifications ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-12"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <motion.div variants={item}>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-widest uppercase mb-1">
                        <Zap className="h-4 w-4 fill-current" />
                        Mission Control
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">
                        Ops Center: {user?.fullName?.split(' ')[0]}
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl font-medium mt-1">
                        Managing {stats?.totalJobs || 0} jobs across the platform.
                    </p>
                </motion.div>
                <motion.div variants={item} className="flex gap-3">
                    {hasPermission('CREATE_JOBS') && (
                        <Button className="h-12 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 px-8 rounded-2xl font-bold" asChild>
                            <Link href="/staff/jobs/create">
                                <PlusCircle className="mr-2 h-4 w-4" /> Dispatch Job
                            </Link>
                        </Button>
                    )}
                </motion.div>
            </div>

            {/* Stats Grid */}
            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {opsStats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm hover:shadow-xl transition-all group rounded-2xl overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-2 rounded-xl transition-colors group-hover:bg-indigo-600 group-hover:text-white", stat.bg, stat.color)}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <TrendingUp className="h-3 w-3" />
                                    LIVE
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Live Operations Feed */}
                <motion.div variants={item} className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <Activity className="h-6 w-6 text-indigo-600" />
                            Live Activity Feed
                        </h2>
                        <Button variant="ghost" size="sm" className="text-indigo-600 font-bold hover:bg-indigo-50" asChild>
                            <Link href="/staff/requests">
                                Open All Requests <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time System Audit</span>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">Syncing...</span>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                                {auditLogs.length > 0 ? (
                                    auditLogs.map((log, idx) => (
                                        <div key={log.id} className="flex items-start justify-between p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                            <div className="flex gap-4 items-start">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110",
                                                    log.action.includes('APPROVE') ? "bg-emerald-100 text-emerald-600" :
                                                        log.action.includes('REJECT') ? "bg-red-100 text-red-600" : "bg-indigo-50 text-indigo-600"
                                                )}>
                                                    {log.action.includes('APPROVE') ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-900">{log.actionDetail}</p>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase">{log.entityType}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1 font-medium">
                                                        Executed by <span className="text-indigo-600 font-bold">{log.actorEmail?.split('@')[0]}</span> • {formatDistanceToNow(new Date(log.createdAt))} ago
                                                    </p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity font-bold h-8 rounded-lg" asChild>
                                                <Link href={`/staff/requests?id=${log.entityId}`}>View Detail</Link>
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center text-slate-400 font-medium italic">No recent system activity found.</div>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50/50 text-center border-t">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End of recent history</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Hotspot & Health sidebar */}
                <motion.div variants={item} className="lg:col-span-4 space-y-8">
                    <section className="space-y-4">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                            Activity Hotspots
                        </h2>
                        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden p-6 space-y-6">
                            {[
                                { district: 'Colombo 07', jobs: 42, load: 'High', color: 'bg-red-500' },
                                { district: 'Kandy City', jobs: 28, load: 'Medium', color: 'bg-orange-500' },
                                { district: 'Galle Fort', jobs: 15, load: 'Low', color: 'bg-emerald-500' },
                                { district: 'Negombo', jobs: 12, load: 'Low', color: 'bg-emerald-500' },
                            ].map((loc, i) => (
                                <div key={i} className="space-y-2 group cursor-pointer">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{loc.district}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{loc.jobs} Active Jobs</p>
                                        </div>
                                        <span className={cn("text-[10px] font-black px-2 py-1 rounded-md uppercase text-white", loc.color)}>
                                            {loc.load}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(loc.jobs / 50) * 100}%` }}
                                            className={cn("h-full rounded-full", loc.color)}
                                        />
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 group">
                                View Demand Map <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Card>
                    </section>

                    <Card className="border-none shadow-xl shadow-indigo-100/50 bg-indigo-600 text-white rounded-3xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Fleet Management</CardTitle>
                            <CardDescription className="text-indigo-100">Live worker distribution</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{stats?.totalUsers || 0}</p>
                                    <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">On-boarded Workers</p>
                                </div>
                            </div>
                            <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black h-12 rounded-2xl shadow-lg" asChild>
                                <Link href="/staff/workers">Manage Fleet</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}

function TrendingUpIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    )
}

function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
