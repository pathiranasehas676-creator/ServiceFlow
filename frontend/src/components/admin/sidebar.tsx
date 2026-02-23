'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    UserCheck,
    FileCheck,
    Wallet,
    Users,
    Briefcase,
    BarChart3,
    FileText,
    Settings,
    ShieldAlert,
    Lock,
    Clock,
    Activity,
    ShieldCheck
} from 'lucide-react';

import { useAuth } from '@/lib/hooks/use-auth';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    permission?: string;
}

const navigationGroups: { title: string; items: NavItem[] }[] = [
    {
        title: 'Overview',
        items: [
            { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Requests Inbox', href: '/admin/requests', icon: FileCheck },
            { name: 'Job Board', href: '/admin/jobs', icon: Briefcase },
        ]
    },
    {
        title: 'Management',
        items: [
            { name: 'Services', href: '/admin/services', icon: Briefcase },
            { name: 'Payouts', href: '/admin/finance/payouts', icon: Wallet },
            { name: 'Verifications', href: '/admin/verifications', icon: UserCheck },
            { name: 'Staff Management', href: '/admin/security/staff', icon: Users },
        ]
    },
    {
        title: 'System',
        items: [
            { name: 'RBAC Security', href: '/admin/security', icon: Lock },
            { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
            { name: 'System Errors', href: '/admin/system/errors', icon: ShieldAlert },
            { name: 'Profile Policy', href: '/admin/settings/profile-policy', icon: ShieldCheck },
            { name: 'Settings', href: '/admin/settings', icon: Settings },
        ]
    }
];

interface AdminSidebarProps {
    className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
    const pathname = usePathname();
    const { user, hasPermission } = useAuth();

    const filteredGroups = navigationGroups.map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || hasPermission(item.permission))
    })).filter(group => group.items.length > 0);

    return (
        <div className={cn("hidden h-full w-64 flex-col border-r bg-card shadow-sm md:flex", className)}>
            <div className="flex h-16 items-center border-b px-6">
                <ShieldCheck className="mr-2 h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">ServiceFlow</h1>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-6 scrollbar-none">
                {filteredGroups.map((group) => (
                    <div key={group.title} className="mb-6">
                        <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            {group.title}
                        </h2>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 group',
                                            isActive
                                                ? 'bg-primary/10 text-primary shadow-sm'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        )}
                                    >
                                        <item.icon className={cn(
                                            'h-4 w-4 transition-transform group-hover:scale-110',
                                            isActive ? 'text-primary' : 'text-muted-foreground/60'
                                        )} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="border-t p-4 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center text-white ring-2 shadow-lg bg-indigo-600 ring-indigo-100"
                    )}>
                        <span className="text-sm font-bold">
                            {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
                        </span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">{user?.fullName || 'Admin User'}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">
                            {user?.role?.replace('_', ' ') || 'System Administrator'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
