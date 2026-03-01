'use client';

import { useState } from 'react';
import { StaffSidebar } from '@/components/staff/sidebar';
import { StaffTopbar } from '@/components/staff/topbar';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login');
        } else if (!isLoading && user && (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
            router.push('/unauthorized'); // Or some other page
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Staff Portal...</p>
                </div>
            </div>
        );
    }

    if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN')) {
        return null;
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Desktop Sidebar */}
            <StaffSidebar className="hidden md:flex" />

            {/* Mobile Sidebar (Simplified for now - can use a drawer later) */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <StaffSidebar className="relative flex" />
                </div>
            )}

            <div className="flex flex-1 flex-col overflow-hidden">
                <StaffTopbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scroll-smooth">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            <Toaster position="top-right" richColors />
        </div>
    );
}
