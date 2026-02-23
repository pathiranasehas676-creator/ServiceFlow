import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface ProfilePolicy {
    REQUIRE_PHONE: boolean;
    REQUIRE_ADDRESS: boolean;
    REQUIRE_NIC: boolean;
    REQUIRE_PROFILE_PHOTO: boolean;
    REQUIRE_BANK_DETAILS: boolean;
    REQUIRE_ID_VERIFICATION_FOR_JOBS: boolean;
    REQUIRE_ID_VERIFICATION_FOR_PAYOUTS: boolean;
    REQUIRE_BANK_VERIFICATION_FOR_PAYOUTS: boolean;
    REQUIRE_MIN_PROFILE_SCORE_FOR_JOBS: number;
    REQUIRE_MIN_PROFILE_SCORE_FOR_ONLINE: number;
    REQUIRE_MIN_PROFILE_SCORE_FOR_PAYOUTS: number;
    VERIFICATION_REQUIRE_BACK_ID: boolean;
    VERIFICATION_REQUIRE_SELFIE: boolean;
}

export function useProfilePolicy() {
    return useQuery<ProfilePolicy>({
        queryKey: ['system', 'profile-policy'],
        queryFn: async () => {
            // This is the correct endpoint based on my previous refactoring
            return await api.get('/admin/system/profile-policy');
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
