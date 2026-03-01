'use client';

import { useWorkerProfile } from "@/lib/hooks/worker/use-worker-profile";
import { useMyJobs } from "@/lib/hooks/worker/use-my-jobs";
import { useWallet } from "@/lib/hooks/worker/use-wallet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowRight, Briefcase, Clock, MapPin,
    Wallet, Star, AlertCircle, RefreshCw,
    TrendingUp, UserCheck, Zap, ChevronRight,
    Search, Bell, CheckCircle2, Calendar,
    ArrowUpRight, Target, ShieldCheck, Sparkles,
    LayoutDashboard, History, Settings
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function WorkerDashboard() {
    const { profile, isLoading: isLoadingProfile, toggleOnlineStatus, isTogglingOnline } = useWorkerProfile();
    const { jobs: activeJobs, isLoading: isLoadingJobs } = useMyJobs('ACCEPTED');
    const { wallet, isLoadingWallet } = useWallet();

    const earnings = (wallet?.balanceCents || 0) / 100;
    const trustScore = 100 - (profile?.verificationScore || 0);
    const isOnline = !!profile?.workerProfile?.isOnline;

    const weeklyEarningsData = [
        { day: 'Mon', amount: 120 },
        { day: 'Tue', amount: 95 },
        { day: 'Wed', amount: 180 },
        { day: 'Thu', amount: 240 },
        { day: 'Fri', amount: 150 },
        { day: 'Sat', amount: 380 },
        { day: 'Sun', amount: 210 },
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

    if (isLoadingProfile || isLoadingJobs || isLoadingWallet) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="space-y-6 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                        className="relative h-16 w-16 mx-auto"
                    >
                        <div className="absolute inset-0 border-4 border-indigo-100 rounded-2xl" />
                        <div className="absolute inset-0 border-4 border-indigo-600 rounded-2xl border-t-transparent animate-spin" />
                    </motion.div>
                    <p className="text-slate-400 font-medium text-xs tracking-widest uppercase">Preparing Your Workspace</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-20 px-4 sm:px-0"
        >
            {/* Premium Header */}
            <motion.div variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-black p-8 sm:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[100px] -ml-32 -mb-32 rounded-full" />

                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black tracking-widest uppercase text-indigo-200">
                        <Sparkles className="h-3 w-3" />
                        Professional Account Active
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
                        Welcome, {profile?.fullName?.split(' ')[0]}
                    </h1>
                    <p className="text-slate-400 text-lg sm:text-xl max-w-xl leading-relaxed">
                        Track your performance, manage active jobs, and grow your professional profile with <span className="text-indigo-300 font-bold">ServiceFlow Premium</span>.
                    </p>
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto items-stretch sm:items-center">
                    {/* Working Status Toggle */}
                    <div className="flex flex-col justify-center gap-2 bg-white/5 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="working-status" className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                                Working Status
                            </Label>
                            <div className={cn(
                                "h-2 w-2 rounded-full animate-pulse",
                                isOnline ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-slate-500"
                            )} />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-white whitespace-nowrap">Available for work</span>
                            <Switch
                                id="working-status"
                                checked={isOnline}
                                onCheckedChange={(val) => toggleOnlineStatus(val)}
                                disabled={isTogglingOnline}
                                className="data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                    </div>

                    <Button className="h-auto sm:h-16 px-8 py-4 sm:py-0 rounded-[2rem] bg-white text-slate-900 hover:bg-slate-100 font-bold text-lg shadow-xl hover:-translate-y-1 transition-all group flex items-center justify-center" asChild>
                        <Link href="/worker/wallet">
                            <Wallet className="mr-3 h-5 w-5 text-indigo-600" /> Wallet Overview
                        </Link>
                    </Button>
                </div>
            </motion.div>

            {/* KPI Grid */}
            <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active Tasks" value={activeJobs?.length || 0} icon={Briefcase} color="indigo" growth="+2 today" />
                <StatCard label="Trust Score" value={`${trustScore}%`} icon={UserCheck} color="violet" growth="Excellent" />
                <StatCard label="Rating" value="4.9" icon={Star} color="amber" growth="Top 5%" />
                <StatCard label="Earnings" value={`$${earnings.toLocaleString()}`} icon={TrendingUp} color="emerald" growth="Last 30 days" />
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-8">
                    {/* Visual Earnings Chart */}
                    <motion.div variants={item}>
                        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden border border-slate-100">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-black text-slate-900">Performance Intelligence</CardTitle>
                                        <CardDescription className="text-slate-400">Weekly revenue visualization</CardDescription>
                                    </div>
                                    <div className="p-3 bg-indigo-50 rounded-2xl">
                                        <TrendingUp className="h-6 w-6 text-indigo-600" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="h-[320px] p-8 -mx-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyEarningsData}>
                                        <defs>
                                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '16px',
                                                border: 'none',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#6366f1"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorAmount)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Active Missions */}
                    <motion.section variants={item} className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <LayoutDashboard className="h-6 w-6 text-indigo-600" />
                                Active Workflow
                            </h2>
                            <Button variant="ghost" className="text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl px-4" asChild>
                                <Link href="/worker/jobs">View History <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </div>

                        {!activeJobs || activeJobs.length === 0 ? (
                            <div className="p-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 shadow-sm relative group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Target className="h-16 w-16 text-slate-200 mx-auto mb-6 relative z-10" />
                                <h3 className="text-2xl font-black text-slate-900 relative z-10">All Tasks Completed</h3>
                                <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto relative z-10">You're all caught up! Browse the job board for new opportunities.</p>
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 px-8 rounded-2xl mt-8 shadow-lg shadow-indigo-200 relative z-10" asChild>
                                    <Link href="/worker/jobs/available">Explore Opportunities</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {activeJobs.map((job) => (
                                    <JobCard key={job.id} job={job} />
                                ))}
                            </div>
                        )}
                    </motion.section>
                </div>

                <aside className="lg:col-span-4 space-y-8">
                    {/* Professional Profile */}
                    {trustScore < 100 && (
                        <motion.div variants={item}>
                            <Card className="border-none shadow-2xl shadow-violet-200/30 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[2.5rem] overflow-hidden relative group">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                                <CardHeader className="p-8 pb-4 relative z-10">
                                    <CardTitle className="text-xl font-bold flex items-center gap-3">
                                        <ShieldCheck className="h-6 w-6 text-indigo-200" />
                                        Account Verification
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8 relative z-10">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-4xl font-black">{trustScore}%</p>
                                                <p className="text-xs font-bold text-indigo-100/60 uppercase tracking-widest mt-1">Profile Completeness</p>
                                            </div>
                                            <div className="relative h-16 w-16 flex items-center justify-center">
                                                <svg className="h-full w-full rotate-[-90deg]">
                                                    <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                                    <motion.circle
                                                        cx="32" cy="32" r="28"
                                                        fill="none"
                                                        stroke="white"
                                                        strokeWidth="8"
                                                        strokeLinecap="round"
                                                        initial={{ strokeDasharray: "0 1000" }}
                                                        animate={{ strokeDasharray: `${(trustScore / 100) * 176} 1000` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <UserCheck className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <VerificationItem label="Identity Verified" verified={(profile as any)?.verificationLevel >= 2} />
                                            <VerificationItem label="Skill Certification" verified={trustScore > 80} />
                                            <VerificationItem label="Premium Status" verified={trustScore === 100} />
                                        </div>
                                    </div>
                                    <Button className="w-full bg-white text-indigo-700 hover:bg-slate-50 font-black h-14 rounded-2xl shadow-xl hover:-translate-y-1 transition-all" asChild>
                                        <Link href="/worker/profile">Upgrade Profile</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Growth Analytics */}
                    <motion.div variants={item}>
                        <Card className="border-none shadow-2xl shadow-slate-100 bg-white rounded-[2.5rem] border border-slate-50">
                            <CardHeader className="p-8">
                                <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                                    Growth Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-8 pb-10 space-y-8">
                                <div className="space-y-6">
                                    <ProgressItem label="Task Accuracy" value={98} color="indigo" />
                                    <ProgressItem label="Client Satisfaction" value={95} color="violet" />
                                    <ProgressItem label="Market Competitiveness" value={82} color="emerald" />
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Target</p>
                                        <p className="text-[10px] font-black uppercase text-indigo-600">$1,500.00</p>
                                    </div>
                                    <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner border border-slate-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min((earnings / 1500) * 100, 100)}%` }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                        />
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 leading-relaxed text-center italic">
                                        You're at <span className="font-bold text-slate-900">{Math.round((earnings / 1500) * 100)}%</span> of your weekly goal. Keep it up!
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </aside>
            </div>
        </motion.div>
    );
}

function StatCard({ label, value, icon: Icon, color, growth }: any) {
    const colors: any = {
        indigo: 'bg-indigo-500',
        violet: 'bg-violet-500',
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500'
    };

    return (
        <Card className="border-none shadow-xl shadow-slate-100 bg-white rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg", colors[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1">{label}</p>
                </div>
                <div className="pt-2">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase italic">
                        {growth}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function JobCard({ job }: any) {
    const price = ((job.priceCents || 0) / 100).toFixed(2);

    return (
        <Card className="border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-indigo-100 hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden group bg-white">
            <CardContent className="p-0">
                <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-all duration-500">
                        <Briefcase className="h-8 w-8 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-indigo-50 text-indigo-600">
                                <Clock className="h-3 w-3 inline mr-1" /> {job.timeSlot || 'Standard'}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                                <Zap className="h-3 w-3 inline mr-1" /> Instant Pay
                            </span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">{job.title}</h4>
                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                            <p className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <MapPin className="h-3 w-3" /> {job.district}
                            </p>
                            <div className="h-1 w-1 rounded-full bg-slate-200" />
                            <p className="text-xs font-black text-indigo-600">${price} VALUE</p>
                        </div>
                    </div>
                    <Button size="icon" className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all group-hover:scale-105" asChild>
                        <Link href={`/worker/jobs/${job.id}`}>
                            <ChevronRight className="h-7 w-7" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function VerificationItem({ label, verified }: { label: string; verified?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-indigo-50 uppercase tracking-wider">{label}</span>
            <div className={cn(
                "h-6 w-6 rounded-lg flex items-center justify-center",
                verified ? "bg-white/20 text-white" : "bg-black/20 text-white/20"
            )}>
                <CheckCircle2 className="h-4 w-4" />
            </div>
        </div>
    );
}

function ProgressItem({ label, value, color }: { label: string; value: number; color: string }) {
    const barColors: any = {
        indigo: 'bg-indigo-500',
        violet: 'bg-violet-500',
        emerald: 'bg-emerald-500'
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                <span className="text-xs font-black text-slate-900">{value}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={cn("h-full rounded-full shadow-sm", barColors[color])}
                />
            </div>
        </div>
    );
}
