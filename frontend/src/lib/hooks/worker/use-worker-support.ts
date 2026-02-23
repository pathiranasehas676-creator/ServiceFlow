import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

export interface MyTicket {
    id: string;
    ticketNumber: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
    _count: {
        messages: number;
    };
}

export interface TicketMessage {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        fullName: string;
        role: string;
    };
    isInternal: boolean;
}

export interface MyTicketDetail {
    id: string;
    ticketNumber: string;
    subject: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
    creator: {
        id: string;
        fullName: string;
        email: string;
        role: string;
    };
    messages: TicketMessage[];
}

export function useMyTickets(filters?: {
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: ['worker', 'support', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
            if (filters?.q) params.append('q', filters.q);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());

            return await api.get(`/worker/support?${params.toString()}`);
        },
    });
}

export function useMyTicketDetail(id: string, pollingInterval: number = 15000) {
    return useQuery<MyTicketDetail>({
        queryKey: ['worker', 'support', id],
        queryFn: async () => {
            return await api.get(`/worker/support/${id}`);
        },
        enabled: !!id,
        refetchInterval: pollingInterval, // Poll every 15 seconds
    });
}

export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { subject: string; description: string }) => {
            return await api.post('/worker/support', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'support'] });
            toast.success('Support ticket created successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to create ticket');
        },
    });
}

export function useReplyToMyTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
            return await api.post(`/worker/support/${ticketId}/reply`, { message });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'support', variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ['worker', 'support'] });
            toast.success('Reply sent successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to send reply');
        },
    });
}

export function useCloseMyTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ticketId: string) => {
            return await api.post(`/worker/support/${ticketId}/close`, {});
        },
        onSuccess: (_, ticketId) => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'support', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['worker', 'support'] });
            toast.success('Ticket closed successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to close ticket');
        },
    });
}
