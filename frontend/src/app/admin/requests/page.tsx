'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProofApprovalsTab, PayoutRequestsTab, VerificationRequestsTab, SupportTicketsTab, BankVerificationsTab, DisputesTab, RegistrationRequestsTab } from '@/components/admin/requests';
import { FileCheck, DollarSign, ShieldCheck, MessageSquare, Building, Scale, UserPlus } from 'lucide-react';


export default function RequestsPage() {
    const [activeTab, setActiveTab] = useState('proofs');

    return (
        <div className="container mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Requests Inbox</h1>
                <p className="text-muted-foreground mt-2">
                    Review and process all operational requests in one place
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-grid h-auto p-1 bg-slate-100/50 rounded-2xl">
                    <TabsTrigger value="registrations" className="gap-2 py-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Registrations</span>
                        <span className="sm:hidden">Join</span>
                    </TabsTrigger>
                    <TabsTrigger value="proofs" className="gap-2 py-2">
                        <FileCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Proof Approvals</span>
                        <span className="sm:hidden">Proofs</span>
                    </TabsTrigger>
                    <TabsTrigger value="payouts" className="gap-2 py-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">Payout Requests</span>
                        <span className="sm:hidden">Payouts</span>
                    </TabsTrigger>
                    <TabsTrigger value="verifications" className="gap-2 py-2">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">ID Verifications</span>
                        <span className="sm:hidden">IDs</span>
                    </TabsTrigger>
                    <TabsTrigger value="banks" className="gap-2 py-2">
                        <Building className="h-4 w-4" />
                        <span className="hidden sm:inline">Bank Verific.</span>
                        <span className="sm:hidden">Banks</span>
                    </TabsTrigger>
                    <TabsTrigger value="tickets" className="gap-2 py-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Support Tickets</span>
                        <span className="sm:hidden">Tickets</span>
                    </TabsTrigger>
                    <TabsTrigger value="disputes" className="gap-2 py-2">
                        <Scale className="h-4 w-4" />
                        <span className="hidden sm:inline">Job Disputes</span>
                        <span className="sm:hidden">Disputes</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="registrations" className="space-y-4">
                    <RegistrationRequestsTab />
                </TabsContent>

                <TabsContent value="proofs" className="space-y-4">
                    <ProofApprovalsTab />
                </TabsContent>

                <TabsContent value="payouts" className="space-y-4">
                    <PayoutRequestsTab />
                </TabsContent>

                <TabsContent value="verifications" className="space-y-4">
                    <VerificationRequestsTab />
                </TabsContent>

                <TabsContent value="banks" className="space-y-4">
                    <BankVerificationsTab />
                </TabsContent>

                <TabsContent value="tickets" className="space-y-4">
                    <SupportTicketsTab />
                </TabsContent>

                <TabsContent value="disputes" className="space-y-4">
                    <DisputesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
