'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { VerificationPrompt } from '@/components/worker/verification-prompt';
import { Loader2 } from 'lucide-react';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { profile, isLoading, isError } = useWorkerProfile();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/auth/login');
            } else {
                setAuthorized(true);
            }
        }
    }, [isLoading, router]);

    if (isLoading && !authorized) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
                    <p className="font-bold text-slate-900">Session expired or connection lost</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 text-indigo-600 font-bold"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <Toaster position="top-right" richColors />
            {profile && <VerificationPrompt profile={profile} />}
            {children}
        </div>
    );
}
