'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ProofApprovalsTab,
    PayoutRequestsTab,
    VerificationRequestsTab,
    SupportTicketsTab,
    RegistrationRequestsTab
} from '@/components/admin/requests';
import {
    FileCheck, DollarSign, ShieldCheck,
    MessageSquare, UserPlus, ListTodo,
    Filter, Search, RefreshCw, Layers
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function StaffRequestsPage() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'proofs';
    const [activeTab, setActiveTab] = useState(initialTab);
    const { hasPermission } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Update active tab if URL parameter changes
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Layers className="h-8 w-8 text-indigo-600" />
                        Operations Inbox
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Review and authorize system-wide service requests.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search requests..." className="pl-9 w-[200px] lg:w-[300px] border-slate-200" />
                    </div>
                    <Button variant="outline" size="icon" onClick={handleRefresh} className={isRefreshing ? 'animate-spin' : ''}>
                        <RefreshCw className="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="outline" className="gap-2 font-bold text-slate-600 border-slate-200">
                        <Filter className="h-4 w-4" /> Filters
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit overflow-x-auto max-w-full">
                    <TabsList className="bg-transparent h-auto p-0 gap-1 flex">
                        {hasPermission('VIEW_REQUESTS') && (
                            <TabsTrigger value="proofs" className="request-tab">
                                <FileCheck className="h-4 w-4" />
                                Proofs
                                <span className="tab-badge bg-indigo-100 text-indigo-700">12</span>
                            </TabsTrigger>
                        )}

                        {hasPermission('MANAGE_USERS') && (
                            <TabsTrigger value="verifications" className="request-tab">
                                <ShieldCheck className="h-4 w-4" />
                                Verifications
                                <span className="tab-badge bg-purple-100 text-purple-700">4</span>
                            </TabsTrigger>
                        )}

                        {hasPermission('PROCESS_PAYOUTS') && (
                            <TabsTrigger value="payouts" className="request-tab">
                                <DollarSign className="h-4 w-4" />
                                Payouts
                                <span className="tab-badge bg-emerald-100 text-emerald-700">3</span>
                            </TabsTrigger>
                        )}

                        {hasPermission('VIEW_REQUESTS') && (
                            <TabsTrigger value="registrations" className="request-tab">
                                <UserPlus className="h-4 w-4" />
                                Registrations
                            </TabsTrigger>
                        )}

                        {hasPermission('VIEW_SUPPORT_TICKETS') && (
                            <TabsTrigger value="tickets" className="request-tab">
                                <MessageSquare className="h-4 w-4" />
                                Tickets
                                <span className="tab-badge bg-orange-100 text-orange-700">2</span>
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
                    <TabsContent value="proofs" className="tab-content">
                        <ProofApprovalsTab />
                    </TabsContent>

                    <TabsContent value="verifications" className="tab-content">
                        <VerificationRequestsTab />
                    </TabsContent>

                    <TabsContent value="payouts" className="tab-content">
                        <PayoutRequestsTab />
                    </TabsContent>

                    <TabsContent value="registrations" className="tab-content">
                        <RegistrationRequestsTab />
                    </TabsContent>

                    <TabsContent value="tickets" className="tab-content">
                        <SupportTicketsTab />
                    </TabsContent>
                </div>
            </Tabs>

            <style jsx global>{`
                .request-tab {
                    @apply flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 
                           text-slate-500 data-[state=active]:bg-indigo-600 data-[state=active]:text-white 
                           hover:bg-slate-50 hover:text-slate-900 border-none shadow-none;
                }
                .tab-badge {
                    @apply ml-1 px-2 py-0.5 rounded-full text-[10px] font-black group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white;
                }
                .tab-content {
                    @apply m-0 p-0 focus-visible:outline-none focus-visible:ring-0;
                }
            `}</style>
        </div>
    );
}
