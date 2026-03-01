import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

export interface SupportTicket {
    id: string;
    ticketNumber: string;
    subject: string;
    description?: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdAt: string;
    updatedAt: string;
    creator: {
        id: string;
        fullName: string;
        email: string;
        role: string;
    };
    _count?: {
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

export interface TicketDetail extends SupportTicket {
    messages: TicketMessage[];
}

export function useStaffSupport(filters?: {
    status?: string;
    q?: string;
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: ['staff', 'support', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.append('status', filters.status);
            if (filters?.q) params.append('q', filters.q);
            if (filters?.page) params.append('page', filters.page.toString());
            if (filters?.limit) params.append('limit', filters.limit.toString());

            return await api.get(`/staff/support?${params.toString()}`);
        },
    });
}

export function useTicketDetail(id: string) {
    return useQuery<TicketDetail>({
        queryKey: ['staff', 'support', id],
        queryFn: async () => {
            return await api.get(`/staff/support/${id}`);
        },
        enabled: !!id,
    });
}

export function useReplyToTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
            return await api.post(`/staff/support/${ticketId}/reply`, { message });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['staff', 'support', variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ['staff', 'support'] });
            toast.success('Reply sent successfully');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to send reply');
        },
    });
}

export function useUpdateTicketStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
            return await api.post(`/staff/support/${ticketId}/status`, { status });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['staff', 'support', variables.ticketId] });
            queryClient.invalidateQueries({ queryKey: ['staff', 'support'] });
            toast.success('Ticket status updated');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update status');
        },
    });
}
