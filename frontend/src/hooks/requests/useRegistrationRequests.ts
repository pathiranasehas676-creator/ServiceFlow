import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

export interface UseRegistrationRequestsParams {
    page?: number;
    limit?: number;
    status?: string | 'all';
    q?: string;
}

export function useRegistrationRequests({
    page = 1,
    limit = 10,
    status = 'all',
    q = ''
}: UseRegistrationRequestsParams = {}) {
    return useQuery({
        queryKey: ['registrationRequests', page, limit, status, q],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                q: q,
                status: status === 'all' ? '' : status,
            });
            return api.get(`/admin/requests/registrations?${params}`);
        },
    });
}

export function useApproveRegistration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.post(`/admin/requests/registrations/${id}/approve`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registrationRequests'] });
            toast.success('Request approved');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to approve'),
    });
}

export function useRejectRegistration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(`/admin/requests/registrations/${id}/reject`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registrationRequests'] });
            toast.success('Request rejected');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to reject'),
    });
}

export function useInviteRegistration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, method }: { id: string; method: string }) =>
            api.post(`/admin/requests/registrations/${id}/invite`, { method }),
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['registrationRequests'] });
            toast.success('Invite generated');

            // Return data to allow component logic (redirects etc)
            return data;
        },
        onError: (err: any) => toast.error(err.message || 'Failed to send invite'),
    });
}

export function useCreateRegistrationRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { email: string; fullName: string; phone: string; nic?: string }) =>
            api.post('/admin/requests/registrations', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['registrationRequests'] });
            toast.success('Registration request created');
        },
        onError: (err: any) => toast.error(err.message || 'Failed to create request'),
    });
}
