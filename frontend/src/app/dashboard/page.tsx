
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Calendar, Plus, Clock, Star, MapPin,
    ChevronRight, LogOut, Settings, User,
    Bell, Sparkles, Search, Compass, HardHat,
    ShoppingBag, ShieldCheck, Zap, ArrowRight,
    Trophy, Wallet
} from 'lucide-react';
import Link from 'next/link';

import { useMyJobs } from '@/lib/hooks/worker/use-my-jobs';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useUserStats } from '@/lib/hooks/use-user-stats';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch real data
    const { jobs, isLoading: jobsLoading } = useMyJobs();
    const { unreadCount, notifications } = useNotifications();
    const { stats: userStats } = useUserStats();

    const activeJobs = jobs.filter(j => ['ACCEPTED', 'ARRIVED', 'PROOF_SUBMITTED', 'PENDING_CUSTOMER_CONFIRMATION'].includes(j.status));
    const upcomingJobs = jobs.filter(j => j.status === 'POSTED' || j.status === 'PENDING_PAYMENT');
    const completedJobsCount = jobs.filter(j => ['COMPLETED', 'APPROVED'].includes(j.status)).length;

    // Get the most recent active job for the stepper
    const currentActiveJob = activeJobs[0];

    useEffect(() => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }
        api.get('/users/profile')
            .then(data => {
                setProfile(data);
                setLoading(false);
            })
            .catch(() => router.push('/auth/login'));
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        router.push('/auth/login');
    };

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="space-y-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-slate-500 font-medium font-mono text-xs uppercase tracking-widest">Loading ServiceFlow...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] pb-24 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navigation Header */}
            <header className="bg-white/70 backdrop-blur-2xl border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-200">
                            <Sparkles className="text-white h-6 w-6" />
                        </div>
                        <span className="font-black text-2xl tracking-tight text-slate-900">ServiceFlow</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/notifications">
                            <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                <Bell className="h-5 w-5 text-slate-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-white" />
                                )}
                            </Button>
                        </Link>
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden shadow-inner">
                            {profile?.fullName?.charAt(0) || 'U'}
                        </div>
                    </div>
                </div>
            </header>

            <motion.main
                variants={container}
                initial="hidden"
                animate="show"
                className="max-w-6xl mx-auto px-4 pt-10 space-y-12"
            >
                {/* Hero section */}
                <motion.section variants={item} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            <ShieldCheck className="h-3 w-3" />
                            Verified Customer
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                            Hi, {profile?.fullName?.split(' ')[0]}
                        </h1>
                        <p className="text-slate-500 text-xl font-medium">
                            Ready for your next seamless service?
                        </p>
                    </div>
                    <Button className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 text-xl font-bold group transition-all" asChild>
                        <Link href="/discovery">
                            <Plus className="mr-2 h-6 w-6 group-hover:rotate-90 transition-transform" />
                            Book Service
                        </Link>
                    </Button>
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-12">
                        {/* Stats Widgets */}
                        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <StatCard
                                label="Active Runs"
                                value={userStats?.activeJobs || 0}
                                icon={Clock}
                                color="indigo"
                            />
                            <StatCard
                                label="Total Spent"
                                value={(userStats?.totalSpentCents || 0) / 100}
                                icon={Wallet}
                                color="emerald"
                                isCurrency
                            />
                            <StatCard
                                label="Completed"
                                value={userStats?.totalJobs || 0}
                                icon={Trophy}
                                color="amber"
                            />
                        </motion.div>

                        {/* Active Job Stepper */}
                        {currentActiveJob && (
                            <motion.section variants={item} className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                    <ActivityIcon className="h-6 w-6 text-indigo-600" />
                                    Job Progress
                                </h2>
                                <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white rounded-[2rem] overflow-hidden">
                                    <CardHeader className="pb-2 border-b border-slate-50 p-8">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-2xl font-black text-slate-900">{currentActiveJob.title}</CardTitle>
                                                <p className="text-slate-500 font-medium">Being handled by <span className="text-indigo-600 font-bold">Pro #{currentActiveJob.workerId?.slice(0, 4)}</span></p>
                                            </div>
                                            <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-indigo-100">
                                                {currentActiveJob.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className="relative pt-4 pb-8">
                                            {/* Stepper Line */}
                                            <div className="absolute top-8 left-0 w-full h-1 bg-slate-100 rounded-full">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                                    style={{ width: currentActiveJob.status === 'ACCEPTED' ? '25%' : currentActiveJob.status === 'ARRIVED' ? '50%' : currentActiveJob.status === 'PROOF_SUBMITTED' ? '75%' : '100%' }}
                                                />
                                            </div>

                                            {/* Step Nodes */}
                                            <div className="relative flex justify-between">
                                                <StepNode label="Accepted" active={['ACCEPTED', 'ARRIVED', 'PROOF_SUBMITTED', 'PENDING_CUSTOMER_CONFIRMATION'].includes(currentActiveJob.status)} />
                                                <StepNode label="Arrived" active={['ARRIVED', 'PROOF_SUBMITTED', 'PENDING_CUSTOMER_CONFIRMATION'].includes(currentActiveJob.status)} />
                                                <StepNode label="In Progress" active={['PROOF_SUBMITTED', 'PENDING_CUSTOMER_CONFIRMATION'].includes(currentActiveJob.status)} />
                                                <StepNode label="Final Check" active={['PENDING_CUSTOMER_CONFIRMATION'].includes(currentActiveJob.status)} />
                                            </div>
                                        </div>
                                        <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black font-bold text-white shadow-xl mt-4" asChild>
                                            <Link href={`/worker/jobs/${currentActiveJob.id}`}>
                                                Track Experience <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.section>
                        )}

                        {/* Search & Categories */}
                        <motion.section variants={item} className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Discover Services</h2>
                                <Button variant="link" className="text-indigo-600 font-bold underline decoration-2 underline-offset-8">Explore Menu</Button>
                            </div>
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    placeholder="Need cleaning, repairs or a move?"
                                    className="w-full h-20 pl-16 pr-8 rounded-3xl bg-white border-none shadow-xl shadow-slate-100 focus:shadow-indigo-100/50 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold text-xl placeholder:text-slate-300"
                                />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <CategoryItem label="Home Clean" color="bg-blue-500" icon={Sparkles} />
                                <CategoryItem label="Fix & Repair" color="bg-orange-500" icon={HardHat} />
                                <CategoryItem label="Heavy Lift" color="bg-emerald-500" icon={ShoppingBag} />
                                <CategoryItem label="Custom" color="bg-slate-900" icon={Plus} more />
                            </div>
                        </motion.section>
                    </div>

                    <aside className="lg:col-span-4 space-y-12">
                        {/* Profile Info */}
                        <motion.div variants={item}>
                            <Card className="border-none shadow-2xl shadow-indigo-100/50 bg-white overflow-hidden rounded-[2.5rem]">
                                <CardContent className="p-0">
                                    <div className="h-32 bg-indigo-600 p-8 flex justify-end">
                                        <Button size="icon" variant="secondary" className="h-10 w-10 rounded-2xl bg-white/20 hover:bg-white/30 border-none text-white backdrop-blur-xl">
                                            <Settings className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="px-8 pb-10 -mt-12 text-center space-y-6">
                                        <div className="h-24 w-24 rounded-[2rem] bg-white border-8 border-white shadow-2xl mx-auto flex items-center justify-center text-3xl font-black text-indigo-600">
                                            {profile?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900">{profile?.fullName}</h3>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{profile?.role} MEMBER</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-px bg-slate-50 p-1 rounded-2xl">
                                            <div className="bg-white p-4 rounded-xl text-center">
                                                <p className="text-2xl font-black text-slate-900">{completedJobsCount}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Jobs</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl text-center">
                                                <p className="text-2xl font-black text-slate-900">4.9</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Trust Score</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-100 font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all shadow-sm" onClick={handleLogout}>
                                            <LogOut className="mr-2 h-4 w-4" /> Terminate Session
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Recent Alerts */}
                        <motion.section variants={item} className="space-y-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                                Pulse Radar
                            </h2>
                            <div className="space-y-6">
                                {notifications.length > 0 ? (
                                    notifications.slice(0, 3).map(n => (
                                        <div key={n.id} className="flex gap-4 items-start group cursor-pointer">
                                            <div className="h-12 w-12 rounded-2xl bg-white shadow-lg shadow-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                                <Bell className="h-5 w-5 text-slate-400 group-hover:text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{n.title}</p>
                                                <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Alerts</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>
                    </aside>
                </div>
            </motion.main>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, isCurrency }: any) {
    const colorMap: any = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100/50',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/50',
        amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/50'
    };

    return (
        <Card className="border-none shadow-xl shadow-slate-100 overflow-hidden bg-white group hover:-translate-y-1 transition-all duration-300 rounded-[2rem]">
            <CardContent className="p-6 space-y-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6", colorMap[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <motion.p
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-3xl font-black text-slate-900 leading-none"
                    >
                        {isCurrency ? `$${value}` : value}
                    </motion.p>
                    <p className="text-[10px] font-black text-slate-400 tracking-[0.15em] uppercase mt-2">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function StepNode({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex flex-col items-center gap-3 z-10 w-20">
            <div className={cn(
                "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                active ? "bg-indigo-600 text-white scale-110 rotate-12" : "bg-white text-slate-200 border-2 border-slate-100"
            )}>
                {active ? <CheckCircleIcon className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-slate-200" />}
            </div>
            <span className={cn("text-[10px] font-black uppercase tracking-widest text-center", active ? "text-indigo-600" : "text-slate-300")}>{label}</span>
        </div>
    );
}

function CategoryItem({ label, color, icon: Icon, more }: any) {
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.05 }}
            className="flex flex-col items-center gap-4 group cursor-pointer"
        >
            <div className={cn(
                "h-20 w-20 rounded-[2rem] flex items-center justify-center transition-all shadow-xl",
                more ? "bg-white border-4 border-slate-50 text-slate-300 hover:border-slate-100" : color + " text-white shadow-indigo-200"
            )}>
                {Icon && <Icon className="h-8 w-8" />}
            </div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{label}</span>
        </motion.div>
    );
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}

function ActivityIcon(props: any) {
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
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    )
}
