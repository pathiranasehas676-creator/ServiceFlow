
'use client';

import { RegistrationsInbox } from '@/components/requests/RegistrationsInbox';
import { PermissionGuard } from '@/components/auth/permission-guard';

export default function StaffRegistrationsPage() {
    return (
        <PermissionGuard permission="VIEW_REQUESTS">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Registration Requests</h1>
                    <p className="text-muted-foreground mt-2">
                        Review and process pending registration requests.
                    </p>
                </div>
                <RegistrationsInbox roleScope="staff" />
            </div>
        </PermissionGuard>
    );
}
