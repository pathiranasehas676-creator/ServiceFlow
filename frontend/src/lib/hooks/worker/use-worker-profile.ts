import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { WorkerProfile } from '@/lib/types/worker';
import { toast } from 'sonner';

export function useWorkerProfile() {
    const queryClient = useQueryClient();

    const profileQuery = useQuery<WorkerProfile>({
        queryKey: ['worker', 'profile'],
        queryFn: async () => {
            const response = await apiClient.get('/auth/me');
            return response.data;
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: Partial<WorkerProfile>) => {
            const response = await apiClient.put('/worker/profile', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'profile'] });
            toast.success('Profile updated successfully');
        },
        onError: () => {
            toast.error('Failed to update profile');
        },
    });

    const updateBankMutation = useMutation({
        mutationFn: async (data: WorkerProfile['bankDetails']) => {
            const response = await apiClient.put('/worker/bank', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'profile'] });
            toast.success('Bank details updated');
        },
        onError: () => {
            toast.error('Failed to update bank details');
        },
    });

    const idStatusQuery = useQuery({
        queryKey: ['worker', 'id-status'],
        queryFn: async () => {
            const response = await apiClient.get('/worker/id-status');
            return response.data;
        },
    });

    return {
        profile: profileQuery.data,
        isLoading: profileQuery.isLoading,
        isError: profileQuery.isError,
        updateProfile: updateProfileMutation.mutate,
        isUpdating: updateProfileMutation.isPending,
        updateBank: updateBankMutation.mutate,
        isUpdatingBank: updateBankMutation.isPending,
        idStatus: idStatusQuery.data,
        isLoadingIdStatus: idStatusQuery.isLoading,
    };
}
