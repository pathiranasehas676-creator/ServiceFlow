export interface Wallet {
    id: string;
    userId: string;
    availableBalanceCents: number;
    pendingBalanceCents: number;
    totalEarnedCents: number;
    createdAt: string;
    updatedAt: string;
}

export interface Transaction {
    id: string;
    walletId: string;
    type: 'CREDIT' | 'DEBIT';
    amountCents: number;
    balanceAfterCents: number;
    status: 'COMPLETE' | 'PENDING' | 'FAILED' | 'REVERSED';
    referenceType: string;
    referenceId: string;
    description: string;
    createdAt: string;
    completedAt?: string;
}

export interface PayoutRequest {
    id: string;
    walletId: string;
    amountCents: number;
    type: 'WEEKLY' | 'SPECIAL'; // Based on requirements
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
    bankData?: any; // If applicable
    rejectionReason?: string;
    transactionRef?: string; // Receipt URL or ref
    createdAt: string;
    updatedAt: string;
    paidAt?: string;
    reviewedAt?: string;
}

export interface PaginatedTransactions {
    data: Transaction[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}
