'use client';

import { RegistrationsInbox } from '@/components/requests/RegistrationsInbox';

export function RegistrationRequestsTab() {
    return <RegistrationsInbox roleScope="admin" />;
}
