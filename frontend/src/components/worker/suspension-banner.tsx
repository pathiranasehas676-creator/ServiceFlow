'use client';

import { AlertTriangle } from 'lucide-react';
import { WorkerProfile } from '@/lib/types/worker';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SuspensionBannerProps {
    profile: WorkerProfile;
}

export function SuspensionBanner({ profile }: SuspensionBannerProps) {
    if (profile.status !== 'SUSPENDED') return null;

    return (
        <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="max-w-7xl mx-auto flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800">Account Temporarily Restricted</h3>
                    <p className="text-sm text-red-700 mt-1">
                        Your account has been suspended due to security flags or policy violations.
                        While suspended, you cannot accept new jobs or request payouts.
                    </p>
                    <div className="mt-3 flex gap-3">
                        <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-900 bg-white" asChild>
                            <Link href="/worker/support">Contact Support</Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-700 hover:text-red-900 hover:bg-red-100" asChild>
                            <Link href="/worker/profile">Review Profile</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
