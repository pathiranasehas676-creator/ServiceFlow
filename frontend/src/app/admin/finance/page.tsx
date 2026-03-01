'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletList } from './components/WalletList';
import { TransactionList } from './components/TransactionList';
import { PayoutsTab } from './components/PayoutsTab';
import { ReconciliationTab } from './components/ReconciliationTab';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FinancePage() {
    const [tab, setTab] = React.useState('payouts');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Operations</h1>
                    <p className="text-muted-foreground">Manage wallets, process payouts, and audit transactions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                        <FileDown className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="payouts" onValueChange={setTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="payouts">Payout Processing</TabsTrigger>
                    <TabsTrigger value="wallets">Worker Wallets</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Pending Payouts</h3>
                            <div className="text-2xl font-bold mt-2">--</div>
                            <p className="text-xs text-muted-foreground">Requests awaiting approval</p>
                        </div>
                        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Available Balance</h3>
                            <div className="text-2xl font-bold mt-2">--</div>
                            <p className="text-xs text-muted-foreground">System-wide worker funds</p>
                        </div>
                        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Processed Today</h3>
                            <div className="text-2xl font-bold mt-2">--</div>
                            <p className="text-xs text-muted-foreground">Paid out successfully</p>
                        </div>
                        <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">System Revenue</h3>
                            <div className="text-2xl font-bold mt-2">--</div>
                            <p className="text-xs text-muted-foreground">Platform fees collected</p>
                        </div>
                    </div>
                    <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted/20">
                        Select a tab to manage finance operations.
                    </div>
                </TabsContent>

                <TabsContent value="payouts" className="space-y-4">
                    <PayoutsTab />
                </TabsContent>

                <TabsContent value="wallets" className="space-y-4">
                    <WalletList />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <TransactionList />
                </TabsContent>

                <TabsContent value="reconciliation" className="space-y-4">
                    <ReconciliationTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
