export type JobStatus = 'POSTED' | 'ACCEPTED' | 'ARRIVED' | 'PROOF_SUBMITTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'PENDING_PAYMENT' | 'PENDING_CUSTOMER_CONFIRMATION';

export interface WorkerProfile {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    role: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'BLACKLISTED';
    verificationScore: number;
    verificationLevel: number;
    riskFlags: string[];
    wallet?: Wallet;
    workerProfile?: {
        id: string;
        fullName?: string;
        nicNumber?: string;
        documentType?: string;
        address?: string;
        bio?: string;
        skills?: string[];
        hourlyRateCents?: number;
        profilePhotoFileKey?: string;
        verificationStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
        rejectionReason?: string;
        adminNotes?: string;
        profileCompleted: boolean;
        completionScore: number;
        missingProfileItems?: any;
        lastComputedAt?: string;
        isOnline: boolean;
        bankDetails?: {
            id: string;
            bankName: string;
            accountName: string;
            accountNumberLast4: string;
            isVerified: boolean;
        };
        performance?: {
            totalJobs: number;
            rating: number;
            onTimeArrivals: number;
            cancellationCount: number;
            noShowCount: number;
            reliabilityScore: number;
        };
    };
}

export interface Job {
    id: string;
    title: string;
    description: string;
    serviceId: string;
    service?: { name: string; category?: string };
    district: string;
    location: string;
    address?: string;
    lat?: number;
    lng?: number;
    budget: number;
    priceCents: number;
    status: JobStatus;
    postedAt: string;
    executionDate?: string;
    acceptedAt?: string;
    arrivedAt?: string;
    arrivedLatitude?: number;
    arrivedLongitude?: number;
    arrivalDistanceMeters?: number;
    arrivalIp?: string;
    completedAt?: string;
    proofUrls?: string[];
    proofs?: { id: string; imageUrl?: string; fileSizeBytes: number; uploadedAt: string }[];
    rejectionReason?: string;
    cancelReason?: string;
    cancelNote?: string;
    workerId?: string;
    worker?: { user: { fullName: string; email: string } };
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
