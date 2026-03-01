import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints } from '../endpoints';
import { toast } from 'sonner';

export type JobStatus =
    | 'POSTED'
    | 'ACCEPTED'
    | 'ARRIVED'
    | 'PROOF_SUBMITTED'
    | 'APPROVED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REJECTED'
    | 'PENDING_PAYMENT'
    | 'PENDING_CUSTOMER_CONFIRMATION';

export interface Job {
    id: string;
    title: string;
    description: string;
    status: JobStatus;
    serviceId: string;
    serviceName: string;
    district: string;
    priceCents: number;
    locationLat: number;
    locationLng: number;
    scheduledAt?: string;
    acceptedAt?: string;
    arrivedAt?: string;
    completedAt?: string;
    createdAt: string;
    workerId?: string;
    worker?: {
        id: string;
        name: string;
    };
}

export function useJobDetails(jobId: string) {
    return useQuery({
        queryKey: ['job', jobId],
        queryFn: () => api.get<Job>(endpoints.jobs.details(jobId)),
        enabled: !!jobId,
    });
}

export function useMyJobs(filters: { status?: string; page?: number } = {}) {
    return useQuery({
        queryKey: ['jobs', 'my', filters],
        queryFn: () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.page) params.append('page', filters.page.toString());

            return api.get<{ data: Job[]; total: number }>(
                `${endpoints.jobs.list}?${params.toString()}`
            );
        },
    });
}

export function useRecordArrival() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ jobId, lat, lng }: { jobId: string; lat: number; lng: number }) =>
            api.post(endpoints.jobs.arrive(jobId), { lat, lng }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            toast.success('Arrival recorded successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to record arrival');
        },
    });
}
