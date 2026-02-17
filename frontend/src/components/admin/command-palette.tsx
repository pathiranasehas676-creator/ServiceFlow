'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard,
    Settings,
    ShieldCheck,
    CheckCircle2,
    Clock,
    History,
    LayoutDashboard,
    Users,
} from 'lucide-react';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command (Ctrl+K)..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => router.push('/admin'))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard Overivew</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/admin/users'))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>User Management</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Governance">
                    <CommandItem onSelect={() => runCommand(() => router.push('/admin/verifications'))}>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        <span>Worker Verifications</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/admin/finance?tab=payouts'))}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Payout Requests</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/admin/audit-logs'))}>
                        <History className="mr-2 h-4 w-4" />
                        <span>System Audit Logs</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="System">
                    <CommandItem onSelect={() => runCommand(() => router.push('/admin/settings/sessions'))}>
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Active Sessions</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push('/admin/settings'))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Settings</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
