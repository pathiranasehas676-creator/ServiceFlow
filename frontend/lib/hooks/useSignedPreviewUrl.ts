import { useQuery } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints, buildQueryString } from '../endpoints';

interface SignedUrlResponse {
    getUrl: string;
    expiresIn: number;
    mimeType: string;
    sizeBytes: number;
}

/**
 * Fetch signed preview URL for a private object
 * Cached for 60 seconds to avoid excessive requests
 */
export function useSignedPreviewUrl(objectKey: string | null | undefined, enabled = true) {
    return useQuery({
        queryKey: ['preview', objectKey],
        queryFn: () => {
            if (!objectKey) throw new Error('No object key provided');
            return api.get<SignedUrlResponse>(
                `${endpoints.storage.preview}${buildQueryString({ objectKey })}`
            );
        },
        enabled: enabled && !!objectKey,
        staleTime: 60 * 1000, // 60 seconds
        gcTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
    });
}

/**
 * Fetch multiple signed URLs at once
 * Useful for galleries
 */
export function useSignedPreviewUrls(objectKeys: string[], enabled = true) {
    return useQuery({
        queryKey: ['preview', 'batch', objectKeys],
        queryFn: async () => {
            const results = await Promise.all(
                objectKeys.map((objectKey) =>
                    api.get<SignedUrlResponse>(
                        `${endpoints.storage.preview}${buildQueryString({ objectKey })}`
                    ).catch((error) => ({
                        objectKey,
                        error: error.message,
                        getUrl: null,
                    }))
                )
            );
            return results;
        },
        enabled: enabled && objectKeys.length > 0,
        staleTime: 60 * 1000,
        gcTime: 2 * 60 * 1000,
    });
}
