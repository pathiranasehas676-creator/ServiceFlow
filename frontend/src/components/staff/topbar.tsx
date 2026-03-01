'use client';

import { Search, Bell, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/hooks/use-notifications';

interface StaffTopbarProps {
    onMenuClick?: () => void;
}

export function StaffTopbar({ onMenuClick }: StaffTopbarProps) {
    const { unreadCount } = useNotifications();
    const router = useRouter();

    return (
        <div className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-8 shadow-sm">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
                <div className="relative max-w-md group hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-indigo-600" />
                    <Input
                        placeholder="Search jobs, services, or tickets..."
                        className="pl-10 h-10 bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-indigo-600/20"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative group" onClick={() => router.push('/staff/notifications')}>
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
