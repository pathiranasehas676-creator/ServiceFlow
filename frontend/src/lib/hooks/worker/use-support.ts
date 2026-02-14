import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { SupportTicket, TicketMessage } from '@/lib/types/worker';
import { toast } from 'sonner';

export function useSupport() {
    const queryClient = useQueryClient();

    const ticketsQuery = useQuery<SupportTicket[]>({
        queryKey: ['support', 'tickets'],
        queryFn: async () => {
            const response = await apiClient.get('/support/tickets');
            return response.data;
        },
    });

    const createTicketMutation = useMutation({
        mutationFn: async (data: { subject: string; category: string; message: string }) => {
            const response = await apiClient.post('/support/tickets', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
            toast.success('Support ticket created');
        },
        onError: () => {
            toast.error('Failed to create ticket');
        },
    });

    return {
        tickets: ticketsQuery.data || [],
        isLoading: ticketsQuery.isLoading,
        createTicket: createTicketMutation.mutate,
        isCreating: createTicketMutation.isPending,
    };
}

import { useWorkerProfile } from './use-worker-profile';
import { queueService } from '@/lib/offline/queue-service';
import { useOfflineQueue } from '../use-offline-queue';

export function useTicketDetail(ticketId: string) {
    const queryClient = useQueryClient();
    const { profile } = useWorkerProfile();
    const { queue } = useOfflineQueue();

    const ticketQuery = useQuery<SupportTicket>({
        queryKey: ['support', 'ticket', ticketId],
        queryFn: async () => {
            const response = await apiClient.get(`/support/tickets/${ticketId}`);
            return response.data;
        },
        enabled: !!ticketId,
    });

    const messagesQuery = useQuery<TicketMessage[]>({
        queryKey: ['support', 'messages', ticketId],
        queryFn: async () => {
            const response = await apiClient.get(`/support/tickets/${ticketId}`);
            return response.data.messages;
        },
        enabled: !!ticketId,
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (message: string) => {
            if (!navigator.onLine) {
                if (!profile?.id) throw new Error("Authentication required to queue messages");

                await queueService.enqueue({
                    type: 'TICKET_MESSAGE',
                    userId: profile.id,
                    payload: { ticketId, message },
                    dedupeKey: `msg:${ticketId}:${new Date().getTime()}`
                });
                return { offline: true };
            }
            const response = await apiClient.post(`/support/tickets/${ticketId}/messages`, { message });
            return response.data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['support', 'messages', ticketId] });
            if (data?.offline) {
                toast.info("Message queued (Offline)");
            } else {
                toast.success('Message sent');
            }
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to send message');
        },
    });

    const queuedMessages: TicketMessage[] = queue
        .filter(item => item.type === 'TICKET_MESSAGE' && item.payload.ticketId === ticketId)
        .map(item => ({
            id: item.id,
            ticketId: item.payload.ticketId,
            senderId: profile?.id || 'me',
            message: item.payload.message,
            senderName: profile?.fullName || 'Me',
            senderRole: 'WORKER',
            createdAt: item.createdAt,
            status: 'QUEUED' as any
        }));

    const allMessages = [...(messagesQuery.data || []), ...queuedMessages];

    return {
        ticket: ticketQuery.data,
        messages: allMessages,
        isLoading: ticketQuery.isLoading || messagesQuery.isLoading,
        sendMessage: sendMessageMutation.mutate,
        isSending: sendMessageMutation.isPending,
    };
}
