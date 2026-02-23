'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Briefcase,
    CheckCircle2,
    Wallet,
    Receipt,
    User,
    LifeBuoy,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const navItems = [
    {
        group: 'Jobs', items: [
            { name: 'Dashboard', href: '/worker/dashboard', icon: LayoutDashboard },
            { name: 'Available Jobs', href: '/worker/jobs/available', icon: Briefcase },
            { name: 'My Accepted Jobs', href: '/worker/jobs/accepted', icon: CheckCircle2 },
        ]
    },
    {
        group: 'Finance', items: [
            { name: 'My Wallet', href: '/worker/wallet', icon: Wallet },
            { name: 'Payment History', href: '/worker/wallet', icon: Receipt }, // Both point to wallet for now as it has history
        ]
    },
    {
        group: 'Account', items: [
            { name: 'Profile & Identity', href: '/worker/profile', icon: User },
            { name: 'Support Tickets', href: '/worker/support', icon: LifeBuoy },
        ]
    }
];

export function WorkerSidebar() {
    const pathname = usePathname();
    const { profile, toggleOnlineStatus, isTogglingOnline } = useWorkerProfile();
    const queryClient = useQueryClient();

    return (
        <div className="hidden h-full w-64 flex-col border-r bg-slate-900 text-slate-100 md:flex">
            <div className="flex h-20 items-center px-8 border-b border-slate-800">
                <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
                    <Briefcase className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Service<span className="text-indigo-400">Flow</span></h1>
            </div>

            <div className="px-6 py-6 border-b border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Working Status</span>
                    <Badge variant={profile?.workerProfile?.isOnline ? "default" : "secondary"} className={cn(
                        "text-[10px] h-5 rounded-full",
                        profile?.workerProfile?.isOnline ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400"
                    )}>
                        {profile?.workerProfile?.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                </div>
                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <div className="text-sm font-medium">Available for work</div>
                    <Switch
                        checked={profile?.workerProfile?.isOnline}
                        onCheckedChange={(val) => toggleOnlineStatus(val)}
                        disabled={isTogglingOnline}
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-none">
                {navItems.map((group) => (
                    <div key={group.group}>
                        <h2 className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            {group.group}
                        </h2>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center justify-between group rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                                            isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn(
                                                'h-4.5 w-4.5 transition-colors',
                                                isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                                            )} />
                                            {item.name}
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4 text-indigo-300" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white ring-2 ring-slate-800 shadow-xl">
                        <span className="text-sm font-bold">{profile?.fullName?.charAt(0) || 'W'}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate text-slate-100">{profile?.fullName || 'Worker'}</p>
                        <p className="text-[10px] text-slate-500 truncate uppercase">Service Provider</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        api.post('/auth/logout').then(() => window.location.href = '/auth/login');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
}
