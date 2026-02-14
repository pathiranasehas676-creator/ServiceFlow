'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkerSidebar } from '@/components/worker/sidebar';
import { WorkerTopbar } from '@/components/worker/topbar';
import { useWorkerProfile } from '@/lib/hooks/worker/use-worker-profile';
import { Skeleton } from '@/components/ui/skeleton';

import { startSyncEngine } from '@/lib/offline/sync-engine';
import { OfflineBanner } from '@/components/worker/offline-banner';

import { InstallPrompt } from '@/components/pwa/install-prompt';
import { UpdateToast } from '@/components/pwa/update-toast';
import { WorkerMobileNav } from '@/components/worker/mobile-nav';

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
            // Only redirect if we have a clear auth failure
            // Don't redirect on network errors or other API issues
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

            if (!token) {
                // No token at all - definitely not logged in
                router.push('/auth/login');
            } else if (profile && (profile as any).role !== 'WORKER') {
                // Has profile but wrong role
                router.push('/dashboard');
            } else if (profile || !isError) {
                // Has profile OR still loading (no error yet)
                setAuthorized(true);
            }
            // If isError is true but we have a token, show the page anyway
            // The dashboard will handle showing error states
        }
    }, [isLoading, profile, isError, router]);

    if (isLoading || !authorized) {
        return (
            <div className="flex h-screen w-screen items-center justify-center gap-4 bg-slate-50">
                <div className="flex h-full w-full flex-col p-8 space-y-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-[600px] w-64 rounded-xl" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-full w-full rounded-xl" />
                        </div>
                    </div>
                </div>
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
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Mobile Nav visible only on mobile */}
            <WorkerMobileNav />
        </div>
    );
}
