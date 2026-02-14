'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Badge } from '@/components/ui/badge';

export function WorkerTopbar() {
    const { profile } = useWorkerProfile();

    return (
        <div className="flex h-16 items-center justify-between border-b bg-white/80 backdrop-blur-md px-8 sticky top-0 z-40">
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
                <div className="hidden sm:flex flex-col items-end mr-4">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verification</span>
                    <Badge variant="outline" className={cn(
                        "text-[10px] h-5 rounded-full",
                        profile?.idVerificationStatus === 'APPROVED' ? "border-emerald-200 bg-emerald-50 text-emerald-600" :
                            profile?.idVerificationStatus === 'PENDING' ? "border-yellow-200 bg-yellow-50 text-yellow-600" :
                                "border-red-200 bg-red-50 text-red-600"
                    )}>
                        {profile?.idVerificationStatus || 'UNVERIFIED'}
                    </Badge>
                </div>

                <Button variant="ghost" size="icon" className="relative group hover:bg-indigo-50">
                    <Bell className="h-5 w-5 text-slate-600 group-hover:text-indigo-600" />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
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
