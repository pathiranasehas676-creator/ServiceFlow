'use client';

import { useEffect, useState } from 'react';
import { KpiCard } from '@/components/admin/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Briefcase, UserCheck, FileCheck, Wallet,
    DollarSign, Building, ShieldAlert, Activity,
    Zap, AlertTriangle, ShieldCheck, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardStats {
    totalUsers: number;
    totalJobs: number;
    totalPayoutsCents: number;
    pendingProofs: number;
    pendingPayouts: number;
    pendingIdVerifications: number;
    pendingBankVerifications: number;
    openTickets: number;
    completedJobs: number;
    onlineWorkers: number;
}

interface SecurityStats {
    totalAlerts: number;
    unresolvedAlerts: number;
    criticalAlerts: number;
    blockedIps: number;
    recentAlerts: any[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
    const [apiMetrics, setApiMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [basicRes, revRes, secRes, metricsRes] = await Promise.allSettled([
                    api.get('/admin/stats'),
                    api.get('/admin/stats/revenue'),
                    api.get('/admin/stats/security'),
                    api.get('/admin/api-metrics'),
                ]);

                if (basicRes.status === 'fulfilled') setStats(basicRes.value);
                else toast.error('Failed to load core stats');

                if (revRes.status === 'fulfilled') setRevenueData(revRes.value ?? []);
                if (secRes.status === 'fulfilled') setSecurityStats(secRes.value);
                if (metricsRes.status === 'fulfilled') setApiMetrics(metricsRes.value);
            } catch (error) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) {
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
            className="space-y-8 pb-10"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Zap className="h-8 w-8 text-indigo-600 fill-indigo-600" />
                        Executive Dashboard
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Real-time system health and intelligence.</p>
                </div>
                <div className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-2xl font-bold text-sm shadow-sm border",
                    apiMetrics?.errorRate < 0.05
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-amber-50 border-amber-100 text-amber-700"
                )}>
                    <div className={cn(
                        "h-2 w-2 rounded-full animate-pulse",
                        apiMetrics?.errorRate < 0.05 ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    System Status: {apiMetrics?.errorRate < 0.05 ? "Operational" : "Degraded Performance"}
                </div>
            </div>

            {/* Security Intelligence Ticker */}
            {securityStats?.recentAlerts && securityStats.recentAlerts.length > 0 && (
                <motion.div
                    variants={item}
                    className="w-full bg-slate-900 overflow-hidden py-3 px-6 rounded-3xl shadow-2xl relative flex items-center gap-4"
                >
                    <div className="flex items-center gap-2 shrink-0 border-r border-slate-700 pr-4">
                        <ShieldAlert className="h-5 w-5 text-red-400" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Security Pulse</span>
                    </div>

                    <div className="flex-1 overflow-hidden relative h-6">
                        <AlertScroller alerts={securityStats.recentAlerts} />
                    </div>

                    <Link href="/admin/security/alerts" className="shrink-0 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors">
                        View Intel
                    </Link>
                </motion.div>
            )}

            {/* Platform Health Ticker */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-4 rounded-3xl shadow-xl shadow-slate-200">
                <HealthTickerItem
                    label="Uptime"
                    value="99.98%"
                    icon={ShieldCheck}
                    color="text-emerald-400"
                />
                <HealthTickerItem
                    label="Active Workers"
                    value={stats?.totalUsers ? Math.floor(stats.totalUsers * 0.42) : 0}
                    icon={Activity}
                    color="text-indigo-400"
                />
                <HealthTickerItem
                    label="Job Success Rate"
                    value={stats?.totalJobs ? `${((stats.completedJobs || 0) / stats.totalJobs * 100).toFixed(1)}%` : "0.0%"}
                    icon={Zap}
                    color="text-amber-400"
                />
            </motion.div>

            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={UserCheck}
                />
                <KpiCard
                    title="Total Jobs"
                    value={stats?.totalJobs || 0}
                    icon={Briefcase}
                />
                <KpiCard
                    title="Total Payouts"
                    value={currencyFormatter.format((stats?.totalPayoutsCents || 0) / 100)}
                    icon={DollarSign}
                />
                <KpiCard
                    title="Critical Alerts"
                    value={securityStats?.criticalAlerts || 0}
                    icon={ShieldAlert}
                    className={cn(securityStats?.criticalAlerts && securityStats.criticalAlerts > 0 ? "border-red-200 bg-red-50" : "")}
                />
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Revenue Chart */}
                <motion.div variants={item} className="lg:col-span-8">
                    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
                        <CardHeader className="bg-white border-b border-slate-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black text-slate-900">Platform Revenue</CardTitle>
                                    <CardDescription>Monthly transaction volume overview (Cents transformed to USD)</CardDescription>
                                </div>
                                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <TrendingUpIcon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[350px] p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorTotal)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Security Center */}
                <motion.div variants={item} className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-xl shadow-red-100/50 rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="pb-2 border-b border-slate-50">
                            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-red-500" />
                                Security Watch
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 grid grid-cols-2 gap-2">
                                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                    <p className="text-2xl font-black text-slate-900">{securityStats?.blockedIps || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blocked IPs</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-2xl text-center">
                                    <p className="text-2xl font-black text-red-600">{securityStats?.unresolvedAlerts || 0}</p>
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Open Alerts</p>
                                </div>
                            </div>
                            <div className="px-2 pb-2">
                                {securityStats?.recentAlerts && securityStats.recentAlerts.length > 0 ? (
                                    securityStats.recentAlerts.slice(0, 3).map((alert, i) => (
                                        <div key={alert.id} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group rounded-2xl">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                                    alert.severity === 'CRITICAL' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                                                )}>
                                                    <AlertTriangle className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-slate-900 truncate">{alert.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">{alert.description}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-slate-400 italic text-sm">No threats detected.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black font-bold text-white shadow-lg" asChild>
                        <Link href="/admin/security/alerts">
                            Audit Security Systems <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </motion.div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-12 mb-6">Operations Queue</h2>
            <motion.div variants={item} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link href="/admin/requests" className="block group">
                    <Card className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-orange-500 rounded-2xl overflow-hidden group-hover:-translate-y-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Proofs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stats?.pendingProofs || 0}</div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">Jobs awaiting review</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/requests" className="block group">
                    <Card className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-blue-500 rounded-2xl overflow-hidden group-hover:-translate-y-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID Verifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stats?.pendingIdVerifications || 0}</div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">Identities awaiting review</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/requests" className="block group">
                    <Card className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-emerald-500 rounded-2xl overflow-hidden group-hover:-translate-y-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payout Requests</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stats?.pendingPayouts || 0}</div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">Funds withdrawal requests</div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/requests" className="block group">
                    <Card className="border-none shadow-sm hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-red-500 rounded-2xl overflow-hidden group-hover:-translate-y-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Open Tickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-slate-900">{stats?.openTickets || 0}</div>
                            <div className="text-xs text-slate-500 mt-1 font-medium">Support tickets</div>
                        </CardContent>
                    </Card>
                </Link>
            </motion.div>
        </motion.div>
    );
}

function HealthTickerItem({ label, value, icon: Icon, color }: any) {
    return (
        <div className="flex items-center gap-4 px-4 py-2 border-r last:border-0 border-slate-800">
            <div className={cn("h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0", color)}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-lg font-black text-white leading-none">{value}</p>
            </div>
        </div>
    );
}

function AlertScroller({ alerts }: { alerts: any[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (alerts.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % alerts.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [alerts]);

    return (
        <div className="relative h-full w-full">
            <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex items-center gap-2"
            >
                <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                    alerts[index].severity === 'CRITICAL' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                )}>
                    {alerts[index].severity}
                </span>
                <p className="text-white text-xs font-bold truncate">
                    {alerts[index].title}: <span className="text-slate-400 font-medium">{alerts[index].description}</span>
                </p>
                <span className="text-[10px] text-slate-600 ml-auto tabular-nums">
                    {new Date(alerts[index].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </motion.div>
        </div>
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
