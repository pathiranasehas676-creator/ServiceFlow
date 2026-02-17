import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { WorkerProfile } from '@/lib/types/worker';
import { toast } from 'sonner';

export function useWorkerProfile() {
    const queryClient = useQueryClient();

    const profileQuery = useQuery<WorkerProfile>({
        queryKey: ['worker', 'profile'],
        queryFn: async () => {
            return await api.get('/auth/me');
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: Partial<WorkerProfile>) => {
            return await api.put('/worker/profile', data);
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
            return await api.put('/worker/bank', data);
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
            return await api.get('/worker/id-status');
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
