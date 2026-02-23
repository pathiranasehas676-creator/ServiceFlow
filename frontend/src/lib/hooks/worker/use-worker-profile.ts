import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { WorkerProfile } from '@/lib/types/worker';
import { toast } from 'sonner';

export function useWorkerProfile() {
    const queryClient = useQueryClient();

    const profileQuery = useQuery<WorkerProfile>({
        queryKey: ['worker', 'profile'],
        queryFn: async () => {
            return await api.get('/users/profile');
        },
    });

    const onError = (err: any) => {
        const errorData = err.response?.data || err.data;
        const message = errorData?.message || err.message || 'An error occurred';

        if (Array.isArray(message)) {
            // NestJS ValidationPipe errors in format: [{property, message}, ...]
            message.forEach((m: any) => {
                toast.error(`${m.property}: ${m.message}`);
            });
        } else {
            toast.error(message);
        }
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const { phoneNumber, ...rest } = data;
            const payload = {
                ...rest,
                phone: phoneNumber
            };
            return await api.patch('/users/profile', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'profile'] });
            toast.success('Profile updated successfully');
        },
        onError,
    });

    const updateBankMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.post('/users/bank-details', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'profile'] });
            toast.success('Bank details updated');
        },
        onError,
    });

    const submitIdVerificationMutation = useMutation({
        mutationFn: async (data: any) => {
            return await api.post('/users/id-verification/submit', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'profile'] });
            toast.success('ID verification submitted');
        },
        onError,
    });

    const confirmPhotoMutation = useMutation({
        mutationFn: async (data: { fileKey: string; mime: string; size: number }) => {
            return await api.post('/users/profile-photo/confirm', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'profile'] });
            toast.success('Profile photo updated');
        },
    });

    const toggleOnlineStatusMutation = useMutation({
        mutationFn: async (isOnline: boolean) => {
            return await api.patch('/users/profile/online-status', { isOnline });
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['worker', 'profile'] });
            queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
            toast.success(data.message || 'Status updated');
        },
        onError: (err: any) => {
            const errorData = err.response?.data;
            const message = errorData?.message || err.message || 'Failed to update status';
            const missingItems = errorData?.missingItems;

            if (missingItems && Array.isArray(missingItems)) {
                toast.error(`${message}: ${missingItems.join(', ')}`);
            } else {
                toast.error(message);
            }
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
        submitIdVerification: submitIdVerificationMutation.mutate,
        isSubmittingId: submitIdVerificationMutation.isPending,
        confirmPhoto: confirmPhotoMutation.mutate,
        isConfirmingPhoto: confirmPhotoMutation.isPending,
        toggleOnlineStatus: toggleOnlineStatusMutation.mutate,
        isTogglingOnline: toggleOnlineStatusMutation.isPending,
    };
}
