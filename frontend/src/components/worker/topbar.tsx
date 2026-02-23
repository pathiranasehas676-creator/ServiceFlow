'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Badge } from '@/components/ui/badge';

import { useNotifications } from '@/lib/hooks/use-notifications';

export function WorkerTopbar() {
    const { profile } = useWorkerProfile();
    const { unreadCount } = useNotifications();
    const router = useRouter();

    return (
        <div className="flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-8 sticky top-0 z-40">
            {/* ... existing search ... */}
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="relative max-w-sm hidden md:block w-full">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Search for jobs..."
                        className="pl-10 h-10 border-slate-200 bg-slate-50/50 focus-visible:ring-indigo-500/20 focus-visible:bg-white"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* ... verification badge ... */}
                {profile?.workerProfile?.verificationStatus !== 'APPROVED' && (
                    <div
                        className="hidden sm:flex flex-col items-end mr-4 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push('/worker/profile?tab=identity')}
                    >
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification</span>
                        <Badge variant="outline" className={cn(
                            "text-[10px] h-5 rounded-full",
                            profile?.workerProfile?.verificationStatus === 'PENDING' ? "border-yellow-200 bg-yellow-50 text-yellow-600" :
                                "border-red-200 bg-red-50 text-red-600 shadow-sm"
                        )}>
                            {profile?.workerProfile?.verificationStatus === 'REJECTED' ? 'REJECTED (View Reason)' : (profile?.workerProfile?.verificationStatus || 'NOT VERIFIED')}
                        </Badge>
                    </div>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/worker/notifications')}
                    className="relative group hover:bg-indigo-50"
                >
                    <Bell className="h-5 w-5 text-slate-600 group-hover:text-indigo-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>

                <div className="h-8 w-[1px] bg-slate-200 mx-2" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-900">{profile?.fullName?.split(' ')[0] || 'Worker'}</span>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Worker</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Fixed import for cn and helper
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
