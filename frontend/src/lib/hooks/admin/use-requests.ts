import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

// Types
export interface PaginationParams {
    page?: number;
    limit?: number;
    status?: string;
    q?: string;
}

export interface ProofRequest {
    id: string;
    title: string;
    description: string;
    status: string;
    priceCents: number;
    worker: {
        id: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            phoneNumber?: string;
        };
    };
    service: {
        name: string;
        category: string;
    };
    proofs: Array<{
        id: string;
        imageUrl: string;
        caption?: string;
        sequenceOrder: number;
    }>;
    updatedAt: string;
    createdAt: string;
}

export interface PayoutRequest {
    id: string;
    amountCents: number;
    status: string;
    type: string;
    wallet: {
        user: {
            id: string;
            fullName: string;
            email: string;
            workerProfile?: {
                bankDetails?: {
                    bankName: string;
                    accountName: string;
                    accountNumberLast4: string;
                    branchCode?: string;
                };
            };
        };
    };
    reviewedAt?: string;
    rejectionReason?: string;
    createdAt: string;
}

export interface VerificationRequest {
    id: string;
    documentType: string;
    documentNumber?: string;
    frontImageKey: string;
    backImageKey?: string;
    status: string;
    workerProfile: {
        user: {
            id: string;
            fullName: string;
            email: string;
        };
    };
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
}

export interface SupportTicket {
    id: string;
    ticketNumber: string;
    subject: string;
    category?: string;
    priority: string;
    status: string;
    creator: {
        id: string;
        fullName: string;
        email: string;
    };
    messages: Array<{
        id: string;
        content: string;
        sender: {
            fullName: string;
            role: string;
        };
        createdAt: string;
    }>;
    _count: {
        messages: number;
    };
    createdAt: string;
    updatedAt: string;
}

// ============================================
// PROOF APPROVALS
// ============================================

export function useProofRequests(params: PaginationParams = {}) {
    return useQuery({
        queryKey: ['admin', 'requests', 'proofs', params],
        queryFn: async () => {
            const response = await api.get<{
                data: ProofRequest[];
                meta: { total: number; page: number; limit: number; totalPages: number };
            }>('/admin/requests/proofs', { params });
            return response;
        },
    });
}

export function useApproveProof() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, note }: { jobId: string; note?: string }) => {
            const response = await api.post(`/admin/requests/proofs/${jobId}/approve`, { note });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'proofs'] });
            toast.success('Proof approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve proof');
        },
    });
}

export function useRejectProof() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ jobId, reason, note }: { jobId: string; reason: string; note?: string }) => {
            const response = await api.post(`/admin/requests/proofs/${jobId}/reject`, { reason, note });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'proofs'] });
            toast.success('Proof rejected');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject proof');
        },
    });
}

// ============================================
// PAYOUT REQUESTS
// ============================================

export function usePayoutRequests(params: PaginationParams = {}) {
    return useQuery({
        queryKey: ['admin', 'requests', 'payouts', params],
        queryFn: async () => {
            const response = await api.get<{
                data: PayoutRequest[];
                meta: { total: number; page: number; limit: number; totalPages: number };
            }>('/admin/requests/payouts', { params });
            return response;
        },
    });
}

export function useApprovePayout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ payoutId, note }: { payoutId: string; note?: string }) => {
            const response = await api.post(`/admin/requests/payouts/${payoutId}/approve`, { note });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'payouts'] });
            toast.success('Payout approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve payout');
        },
    });
}

export function useRejectPayout() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ payoutId, reason, note }: { payoutId: string; reason: string; note?: string }) => {
            const response = await api.post(`/admin/requests/payouts/${payoutId}/reject`, { reason, note });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'payouts'] });
            toast.success('Payout rejected');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject payout');
        },
    });
}

export function useMarkPayoutPaid() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ payoutId, receiptFileKey, transactionRef }: { payoutId: string; receiptFileKey: string; transactionRef?: string }) => {
            const response = await api.post(`/admin/requests/payouts/${payoutId}/mark-paid`, { receiptFileKey, transactionRef });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'payouts'] });
            toast.success('Payout marked as paid');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to mark payout as paid');
        },
    });
}

// ============================================
// ID VERIFICATIONS
// ============================================

export function useVerificationRequests(params: PaginationParams = {}) {
    return useQuery({
        queryKey: ['admin', 'requests', 'verifications', params],
        queryFn: async () => {
            const response = await api.get<{
                data: VerificationRequest[];
                meta: { total: number; page: number; limit: number; totalPages: number };
            }>('/admin/requests/verifications', { params });
            return response;
        },
    });
}

export function useApproveVerification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ verificationId, note }: { verificationId: string; note?: string }) => {
            const response = await api.post(`/admin/requests/verifications/${verificationId}/approve`, { note });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'verifications'] });
            toast.success('Verification approved successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to approve verification');
        },
    });
}

export function useRejectVerification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ verificationId, reason, note }: { verificationId: string; reason: string; note?: string }) => {
            const response = await api.post(`/admin/requests/verifications/${verificationId}/reject`, { reason, note });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'verifications'] });
            toast.success('Verification rejected');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to reject verification');
        },
    });
}

// ============================================
// SUPPORT TICKETS
// ============================================

export function useSupportTickets(params: PaginationParams = {}) {
    return useQuery({
        queryKey: ['admin', 'requests', 'tickets', params],
        queryFn: async () => {
            const response = await api.get<{
                data: SupportTicket[];
                meta: { total: number; page: number; limit: number; totalPages: number };
            }>('/admin/requests/tickets', { params });
            return response;
        },
    });
}

export function useReplyToTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, message, isInternal }: { ticketId: string; message: string; isInternal?: boolean }) => {
            const response = await api.post(`/admin/requests/tickets/${ticketId}/reply`, { message, isInternal });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'tickets'] });
            toast.success('Reply sent successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send reply');
        },
    });
}

export function useCloseTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketId: string) => {
            const response = await api.post(`/admin/requests/tickets/${ticketId}/close`);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'requests', 'tickets'] });
            toast.success('Ticket closed successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to close ticket');
        },
    });
}
