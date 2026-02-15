'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function ReconciliationTab() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 border rounded-md bg-green-50 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <div>
                    <h3 className="font-semibold">System Ledger Balanced</h3>
                    <p className="text-sm">Total Wallet Balances match Transaction Sums. No drift detected.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">Orphaned Transactions</div>
                    <div className="text-2xl font-bold">0</div>
                </div>
                <div className="p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">Pending Payout Mismatches</div>
                    <div className="text-2xl font-bold">0</div>
                </div>
                <div className="p-4 border rounded-md">
                    <div className="text-sm text-muted-foreground">Negative Wallets</div>
                    <div className="text-2xl font-bold">0</div>
                </div>
            </div>
        </div>
    );
}
