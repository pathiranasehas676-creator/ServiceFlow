'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkerSidebar } from '@/components/worker/sidebar';
import { WorkerTopbar } from '@/components/worker/topbar';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

import { startSyncEngine } from '@/lib/offline/sync-engine';
import { OfflineBanner } from '@/components/worker/offline-banner';
import { SuspensionBanner } from '@/components/worker/suspension-banner';

import { InstallPrompt } from '@/components/pwa/install-prompt';
import { UpdateToast } from '@/components/pwa/update-toast';
import { WorkerMobileNav } from '@/components/worker/mobile-nav';
import { VerificationPrompt } from '@/components/worker/verification-prompt';

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
    const { profile, isLoading, isError } = useWorkerProfile();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const cleanup = startSyncEngine();
        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    useEffect(() => {
        if (!isLoading) {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

            if (!token) {
                // No token at all — definitely not logged in
                router.push('/auth/login');
            } else if (profile && (profile as any).role !== 'WORKER') {
                // Has profile but wrong role
                router.push('/dashboard');
            } else {
                // Has token: show the page. Profile may still be loading/empty,
                // or an error occurred — let the page handle those states.
                setAuthorized(true);
            }
        }
    }, [isLoading, profile, isError, router]);

    // We allow rendering even while loading to avoid "skeleton traps".
    // Sub-components will handle their own loading states via shimmer effects.
    if (!authorized && isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50/50">
            <OfflineBanner />
            <InstallPrompt />
            <UpdateToast />
            {/* Sidebar hidden on mobile */}
            <WorkerSidebar />

            <div className="flex flex-1 flex-col overflow-hidden pb-16 md:pb-0">
                <WorkerTopbar />
                {profile && <SuspensionBanner profile={profile} />}
                {profile && <VerificationPrompt profile={profile} />}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Mobile Nav visible only on mobile */}
            <WorkerMobileNav />
        </div>
    );
}
