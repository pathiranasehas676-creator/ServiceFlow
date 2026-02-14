export type JobStatus = 'POSTED' | 'ACCEPTED' | 'ARRIVED' | 'PROOF_SUBMITTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface WorkerProfile {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    isOnline: boolean;
    bankDetails?: {
        accountHolder: string;
        bankName: string;
        accountNumber: string;
        ifscCode: string;
    };
    idVerificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';
    profilePicture?: string;
    workerProfile?: {
        totalJobs: number;
        rating: number;
        skills: string[];
    };
}

export interface Job {
    id: string;
    title: string;
    description: string;
    serviceId: string;
    district: string;
    location: string;
    lat?: number;
    lng?: number;
    budget: number;
    status: JobStatus;
    postedAt: string;
    acceptedAt?: string;
    arrivedAt?: string;
    arrivedLatitude?: number;
    arrivedLongitude?: number;
    arrivalDistanceMeters?: number;
    completedAt?: string;
    proofUrls?: string[];
    rejectionReason?: string;
}

export interface Wallet {
    balanceCents: number; // Storing in cents for precision
    totalEarnedCents: number;
    currency: string;
}

export interface Transaction {
    id: string;
    amountCents: number;
    type: 'EARNING' | 'PAYOUT' | 'ADJUSTMENT';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    description: string;
    createdAt: string;
    jobId?: string;
    receiptUrl?: string;
}

export interface PayoutRequest {
    id: string;
    amountCents: number;
    status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
    createdAt: string;
    processedAt?: string;
    rejectionReason?: string;
    receiptUrl?: string;
}

export interface SupportTicket {
    id: string;
    subject: string;
    category: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
}

export interface TicketMessage {
    id: string;
    ticketId: string;
    senderId: string;
    senderName: string;
    senderRole: 'WORKER' | 'STAFF' | 'ADMIN';
    message: string;
    createdAt: string;
}
