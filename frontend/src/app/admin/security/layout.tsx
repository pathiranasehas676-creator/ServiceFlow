'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePathname, useRouter } from 'next/navigation';

export default function SecurityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const activeTab = pathname.split('/').pop() || 'overview';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Security & RBAC</h1>
                <p className="text-muted-foreground">
                    Manage roles, permissions, and audit system access.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => router.push(`/admin/security/${v}`)} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                    <TabsTrigger value="staff">Staff</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="mt-6">
                {children}
            </div>
        </div>
    );
}
