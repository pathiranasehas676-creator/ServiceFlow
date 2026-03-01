'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';
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
    ShieldCheck,
    PlusCircle,
    UserPlus,
    Hammer,
    LifeBuoy,
    CreditCard
} from 'lucide-react';

const navigationGroups = [
    {
        title: 'Overview',
        items: [
            { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
            {
                name: 'Job Board',
                href: '/staff/jobs',
                icon: Briefcase,
                permission: 'VIEW_ALL_JOBS'
            },
        ]
    },
    {
        title: 'Operations',
        items: [
            {
                name: 'Create Job',
                href: '/staff/jobs/create',
                icon: PlusCircle,
                permission: 'CREATE_JOBS'
            },
            {
                name: 'Assign Jobs',
                href: '/staff/jobs/assign',
                icon: UserPlus,
                permission: 'ASSIGN_JOBS'
            },
            {
                name: 'Services',
                href: '/staff/services',
                icon: Hammer,
                permission: 'MANAGE_SERVICES'
            },
            {
                name: 'Requests Inbox',
                href: '/staff/requests',
                icon: FileCheck,
                permission: 'VIEW_REQUESTS'
            },
            {
                name: 'Registrations',
                href: '/staff/requests/registrations',
                icon: UserPlus,
                permission: 'VIEW_REQUESTS'
            },
            {
                name: 'Verifications',
                href: '/staff/verifications',
                icon: ShieldCheck,
                permission: 'VERIFY_ID'
            },
        ]
    },
    {
        title: 'Support & Finance',
        items: [
            {
                name: 'Support Tickets',
                href: '/staff/support',
                icon: LifeBuoy,
                permission: 'VIEW_SUPPORT_TICKETS'
            },
            {
                name: 'Job Payments',
                href: '/staff/job-payments',
                icon: FileCheck,
                permission: 'MANAGE_JOB_PAYMENTS'
            },
            {
                name: 'Worker Payouts',
                href: '/staff/payouts',
                icon: CreditCard,
                permission: 'PROCESS_PAYOUTS'
            },
        ]
    }
];

interface StaffSidebarProps {
    className?: string;
}

export function StaffSidebar({ className }: StaffSidebarProps) {
    const pathname = usePathname();
    const { user, hasPermission } = useAuth();

    const filteredGroups = navigationGroups.map(group => ({
        ...group,
        items: group.items.filter(item => !item.permission || hasPermission(item.permission))
    })).filter(group => group.items.length > 0);

    return (
        <div className={cn("hidden h-full w-64 flex-col border-r bg-card shadow-sm md:flex", className)}>
            <div className="flex h-16 items-center border-b px-6">
                <ShieldCheck className="mr-2 h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-bold tracking-tight">ServiceFlow <span className="text-[10px] text-muted-foreground uppercase align-top ml-1">Staff</span></h1>
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
                                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        )}
                                    >
                                        <item.icon className={cn(
                                            'h-4 w-4 transition-transform group-hover:scale-110',
                                            isActive ? 'text-indigo-600' : 'text-muted-foreground/60'
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
                    <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white ring-2 ring-indigo-100 shadow-lg">
                        <span className="text-sm font-bold">{user?.fullName?.split(' ').map(n => n[0]).join('') || 'ST'}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">{user?.fullName || 'Staff User'}</p>
                        <p className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{user?.role} Portal</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
