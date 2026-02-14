'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Briefcase,
    CheckCircle2,
    Wallet,
    User
} from 'lucide-react';

export function WorkerMobileNav() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Home', href: '/worker/dashboard', icon: LayoutDashboard },
        { name: 'Jobs', href: '/worker/jobs/available', icon: Briefcase },
        { name: 'Accepted', href: '/worker/jobs/accepted', icon: CheckCircle2 },
        { name: 'Wallet', href: '/worker/earnings', icon: Wallet },
        { name: 'Profile', href: '/worker/profile', icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 block border-t bg-background pb-safe pt-2 md:hidden">
            <nav className="flex justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 p-2 text-xs font-medium transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <item.icon className={cn('h-6 w-6', isActive && 'fill-current/20')} />
                            <span className="text-[10px]">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
