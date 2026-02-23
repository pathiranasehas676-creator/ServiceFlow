'use client';

import { Search, Bell, ShieldAlert, Command, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AdminTopbarProps {
    onMenuClick?: () => void;
}

import { useNotifications } from '@/lib/hooks/use-notifications';
import { useRouter } from 'next/navigation';

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
    const { unreadCount } = useNotifications();
    const router = useRouter();

    return (
        <div className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-8 shadow-sm">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
                <div className="relative max-w-md group hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Type Ctrl+K to search anything..."
                        className="pl-10 h-10 bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/20 cursor-pointer"
                        readOnly
                        onClick={() => {
                            const down = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
                            document.dispatchEvent(down);
                        }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/50 border rounded px-1.5 py-0.5 pointer-events-none shadow-sm">
                        <Command className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[9px] font-bold text-muted-foreground">K</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative group hover:bg-destructive/10" asChild>
                    <Link href="/admin/security/alerts">
                        <ShieldAlert className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-black text-white ring-2 ring-white shadow-sm">
                            3
                        </span>
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="relative" onClick={() => router.push('/admin/notifications')}>
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-white shadow-sm">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
