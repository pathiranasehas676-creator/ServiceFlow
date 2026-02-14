'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProofApprovalsTab } from '@/components/admin/requests/proof-approvals-tab';
import { PayoutRequestsTab } from '@/components/admin/requests/payout-requests-tab';
import { VerificationRequestsTab } from '@/components/admin/requests/verification-requests-tab';
import { SupportTicketsTab } from '@/components/admin/requests/support-tickets-tab';
import { FileCheck, DollarSign, ShieldCheck, MessageSquare } from 'lucide-react';

export default function RequestsPage() {
    const [activeTab, setActiveTab] = useState('proofs');

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Requests Inbox</h1>
                <p className="text-muted-foreground mt-2">
                    Review and process all operational requests in one place
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="proofs" className="gap-2">
                        <FileCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Proof Approvals</span>
                        <span className="sm:hidden">Proofs</span>
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">Payout Requests</span>
                        <span className="sm:hidden">Payouts</span>
                    </TabsTrigger>
                    <TabsTrigger value="verifications" className="gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">ID Verifications</span>
                        <span className="sm:hidden">IDs</span>
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Support Tickets</span>
                        <span className="sm:hidden">Tickets</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="proofs" className="space-y-4">
                    <ProofApprovalsTab />
                </TabsContent>

                <TabsContent value="payouts" className="space-y-4">
                    <PayoutRequestsTab />
                </TabsContent>

                <TabsContent value="verifications" className="space-y-4">
                    <VerificationRequestsTab />
                </TabsContent>

                <TabsContent value="tickets" className="space-y-4">
                    <SupportTicketsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
