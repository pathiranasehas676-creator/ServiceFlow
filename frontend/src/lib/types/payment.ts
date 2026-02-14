export interface JobPayment {
    id: string;
    jobId: string;
    workerId: string;
    amountCents: number;
    status: 'PENDING' | 'PAID' | 'VOID' | 'ON_HOLD';
    approvedById?: string;
    approvedAt?: string;
    paidById?: string;
    paidAt?: string;
    holdReason?: string;
    createdAt: string;
    job?: {
        title: string;
        description: string;
    };
}

export interface PayoutRequest {
    id: string;
    amountCents: number;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | 'FAILED';
    type: 'WEEKLY' | 'SPECIAL';
    requestedAt?: string;
    reviewedAt?: string;
    paidAt?: string;
    rejectionReason?: string;
    adminNote?: string;
    createdAt: string;
}

export interface Wallet {
    availableBalanceCents: number;
    pendingBalanceCents: number;
    totalEarnedCents: number;
}
