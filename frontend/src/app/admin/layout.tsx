'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminTopbar } from '@/components/admin/topbar';
import { CommandPalette } from '@/components/admin/command-palette';
import { Toaster } from '@/components/ui/sonner';
import { MobileAdminSidebar } from '@/components/admin/mobile-sidebar';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
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
        } else if (!isLoading && user && user.role !== 'ADMIN') {
            router.push('/unauthorized');
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return null;
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <AdminSidebar className="hidden md:flex" />

            {/* Mobile Sidebar */}
            <MobileAdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-hidden">
                <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            <CommandPalette />
            <Toaster position="top-right" richColors />
        </div>
    );
}
