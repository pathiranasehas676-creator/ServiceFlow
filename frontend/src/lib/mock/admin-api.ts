import {
    KPIStats,
    VerificationDTO,
    ProofDTO,
    PayoutDTO,
    UserDTO,
    ServiceDTO,
    AuditLogDTO,
    JobDTO,
    WorkerProfileDTO,
} from '@/types/admin';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockWorkerProfile: WorkerProfileDTO = {
    id: 'wp1',
    userId: 'u1',
    isOnline: true,
    latitude: 40.7128,
    longitude: -74.0060,
    verificationStatus: 'PENDING',
    idDocumentUrl: 'https://placehold.co/600x400/png?text=ID+Document',
    bankName: 'Chase Bank',
    accountNumber: '****1234',
    accountName: 'John Worker',
    skills: ['Plumbing', 'Electrical'],
    rating: 4.8,
    totalJobs: 45,
};

const mockWorker: UserDTO & { workerProfile: WorkerProfileDTO } = {
    id: 'u1',
    email: 'john.worker@example.com',
    fullName: 'John Worker',
    role: 'WORKER',
    createdAt: new Date().toISOString(),
    isTwoFactorEnabled: false,
    failedLoginAttempts: 0,
    workerProfile: mockWorkerProfile,
};

export const mockStats: KPIStats = {
    totalJobsToday: 24,
    pendingVerifications: 8,
    pendingProofs: 12,
    pendingPayouts: 5,
    totalPaidThisMonth: 45600,
};

export const mockVerifications: VerificationDTO[] = [
    {
        id: 'v1',
        worker: mockWorker,
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        idDocumentUrl: 'https://placehold.co/600x400/png?text=ID+Front',
    },
    {
        id: 'v2',
        worker: { ...mockWorker, id: 'u2', fullName: 'Jane Smith', email: 'jane@example.com' },
        submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        idDocumentUrl: 'https://placehold.co/600x400/png?text=ID+Document+2',
    },
];

const mockJob: JobDTO = {
    id: 'j1',
    title: 'Fix Kitchen Sink',
    description: 'Leaking kitchen sink needs repair',
    serviceType: 'Plumbing',
    locationLat: 40.7128,
    locationLng: -74.0060,
    address: '123 Main St, New York, NY',
    price: 150,
    status: 'PROOF_SUBMITTED',
    staffId: 's1',
    workerId: 'u1',
    worker: mockWorker,
    proofUrl: 'https://placehold.co/600x400/png?text=Proof+Image',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
};

export const mockProofs: ProofDTO[] = [
    {
        id: 'p1',
        job: mockJob,
        imageUrls: [
            'https://placehold.co/600x400/png?text=Before',
            'https://placehold.co/600x400/png?text=After',
        ],
        submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
    },
    {
        id: 'p2',
        job: { ...mockJob, id: 'j2', title: 'Electrical Wiring' },
        imageUrls: ['https://placehold.co/600x400/png?text=Wiring+Complete'],
        submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
    },
];

export const mockPayouts: PayoutDTO[] = [
    {
        id: 'po1',
        walletId: 'w1',
        worker: mockWorker,
        amount: 450,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'po2',
        walletId: 'w2',
        worker: { ...mockWorker, id: 'u3', fullName: 'Bob Builder', email: 'bob@example.com' },
        amount: 680,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

export const mockUsers: (UserDTO & { workerProfile?: WorkerProfileDTO })[] = [
    mockWorker,
    {
        id: 'u4',
        email: 'staff@example.com',
        fullName: 'Staff Member',
        role: 'STAFF',
        createdAt: new Date().toISOString(),
        isTwoFactorEnabled: true,
        failedLoginAttempts: 0,
    },
    {
        id: 'u5',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        isTwoFactorEnabled: true,
        failedLoginAttempts: 0,
    },
];

export const mockServices: ServiceDTO[] = [
    {
        id: 's1',
        name: 'Plumbing',
        description: 'General plumbing services',
        basePrice: 100,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 's2',
        name: 'Electrical',
        description: 'Electrical repair and installation',
        basePrice: 120,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

export const mockAuditLogs: AuditLogDTO[] = [
    {
        id: 'a1',
        actorId: 'u5',
        actor: mockUsers[2],
        action: 'APPROVE_VERIFICATION',
        entityType: 'WorkerProfile',
        entityId: 'wp1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
        id: 'a2',
        actorId: 'u5',
        actor: mockUsers[2],
        action: 'APPROVE_PAYOUT',
        entityType: 'PayoutRequest',
        entityId: 'po3',
        oldValue: JSON.stringify({ status: 'PENDING' }),
        newValue: JSON.stringify({ status: 'APPROVED' }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
];

// Mock API functions
export const adminApi = {
    async getStats(): Promise<KPIStats> {
        await delay(300);
        return mockStats;
    },

    async getVerifications(): Promise<VerificationDTO[]> {
        await delay(500);
        return mockVerifications;
    },

    async approveVerification(id: string, notes?: string): Promise<void> {
        await delay(800);
        console.log('Approved verification:', id, notes);
    },

    async rejectVerification(id: string, reason: string): Promise<void> {
        await delay(800);
        console.log('Rejected verification:', id, reason);
    },

    async getProofs(): Promise<ProofDTO[]> {
        await delay(500);
        return mockProofs;
    },

    async approveProof(id: string): Promise<void> {
        await delay(800);
        console.log('Approved proof:', id);
    },

    async rejectProof(id: string, reason: string): Promise<void> {
        await delay(800);
        console.log('Rejected proof:', id, reason);
    },

    async getPayouts(): Promise<PayoutDTO[]> {
        await delay(500);
        return mockPayouts;
    },

    async approvePayout(id: string, transactionRef: string, receiptUrl: string): Promise<void> {
        await delay(1000);
        console.log('Approved payout:', id, transactionRef, receiptUrl);
    },

    async rejectPayout(id: string, reason: string): Promise<void> {
        await delay(800);
        console.log('Rejected payout:', id, reason);
    },

    async getUsers(role?: string): Promise<(UserDTO & { workerProfile?: WorkerProfileDTO })[]> {
        await delay(500);
        if (role) {
            return mockUsers.filter(u => u.role === role);
        }
        return mockUsers;
    },

    async getServices(): Promise<ServiceDTO[]> {
        await delay(400);
        return mockServices;
    },

    async createService(data: Partial<ServiceDTO>): Promise<ServiceDTO> {
        await delay(800);
        return {
            id: `s${Date.now()}`,
            name: data.name || '',
            description: data.description,
            basePrice: data.basePrice,
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    },

    async updateService(id: string, data: Partial<ServiceDTO>): Promise<ServiceDTO> {
        await delay(800);
        const service = mockServices.find(s => s.id === id);
        return {
            ...service!,
            ...data,
            updatedAt: new Date().toISOString(),
        };
    },

    async deleteService(id: string): Promise<void> {
        await delay(600);
        console.log('Deleted service:', id);
    },

    async getAuditLogs(): Promise<AuditLogDTO[]> {
        await delay(600);
        return mockAuditLogs;
    },
};
