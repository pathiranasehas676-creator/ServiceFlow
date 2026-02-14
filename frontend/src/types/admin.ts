export type UserRole = 'USER' | 'WORKER' | 'STAFF' | 'ADMIN';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';

export type JobStatus = 'POSTED' | 'ASSIGNED' | 'ACCEPTED' | 'ARRIVED' | 'PROOF_SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface UserDTO {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    createdAt: string;
    isTwoFactorEnabled: boolean;
    failedLoginAttempts: number;
    lockoutUntil?: string | null;
}

export interface WorkerProfileDTO {
    id: string;
    userId: string;
    isOnline: boolean;
    latitude?: number;
    longitude?: number;
    verificationStatus: VerificationStatus;
    idDocumentUrl?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    skills: string[];
    rating: number;
    totalJobs: number;
}

export interface VerificationDTO {
    id: string;
    worker: UserDTO & { workerProfile: WorkerProfileDTO };
    submittedAt: string;
    status: VerificationStatus;
    idDocumentUrl: string;
    notes?: string;
}

export interface JobDTO {
    id: string;
    title: string;
    description: string;
    serviceType: string;
    locationLat: number;
    locationLng: number;
    address: string;
    price: number;
    status: JobStatus;
    staffId: string;
    workerId?: string;
    worker?: UserDTO;
    proofUrl?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProofDTO {
    id: string;
    job: JobDTO;
    imageUrls: string[];
    submittedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
}

export interface PayoutDTO {
    id: string;
    walletId: string;
    worker: UserDTO & { workerProfile: WorkerProfileDTO };
    amount: number;
    status: PayoutStatus;
    adminId?: string;
    receiptUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceDTO {
    id: string;
    name: string;
    description?: string;
    basePrice?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuditLogDTO {
    id: string;
    actorId?: string;
    actor?: UserDTO;
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: string;
    newValue?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

export interface KPIStats {
    totalJobsToday: number;
    pendingVerifications: number;
    pendingProofs: number;
    pendingPayouts: number;
    totalPaidThisMonth: number;
}
