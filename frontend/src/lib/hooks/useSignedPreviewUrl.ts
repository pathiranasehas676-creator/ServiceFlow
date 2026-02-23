
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

interface SignedUrlResponse {
    getUrl: string;
    mimeType?: string;
    sizeBytes?: number;
    objectKey?: string;
}

export function useSignedPreviewUrl(objectKey: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['signedUrl', objectKey],
        queryFn: async () => {
            if (!objectKey) return null;
            try {
                const res = await api.get<SignedUrlResponse>(
                    `/storage/preview?objectKey=${encodeURIComponent(objectKey)}`
                );
                return res;
            } catch (error) {
                console.error(`Failed to get signed URL for ${objectKey}`, error);
                return null;
            }
        },
        enabled: !!objectKey && enabled,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
}

export function useSignedPreviewUrls(objectKeys: string[], enabled = true) {
    return useQuery({
        queryKey: ['signedUrls', objectKeys.join(',')],
        queryFn: async () => {
            if (!objectKeys || objectKeys.length === 0) return [];

            // Parallel fetch
            const promises = objectKeys.map(async (key) => {
                try {
                    const res = await api.get<SignedUrlResponse>(
                        `/storage/preview?objectKey=${encodeURIComponent(key)}`
                    );
                    return { ...res, objectKey: key };
                } catch (error) {
                    console.error(`Failed to get signed URL for ${key}`, error);
                    return null;
                }
            });

            return Promise.all(promises);
        },
        enabled: objectKeys.length > 0 && enabled,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
}
