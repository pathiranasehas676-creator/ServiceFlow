import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints } from '../endpoints';
import { toast } from 'sonner';

interface PresignRequest {
    jobId: string;
    files: {
        mimeType: string;
        sizeBytes: number;
    }[];
}

interface PresignResponse {
    uploads: {
        objectKey: string;
        putUrl: string;
        bucket: string;
        expiresIn: number;
    }[];
}

interface SubmitProofRequest {
    jobId: string;
    proofs: {
        objectKey: string;
        mimeType: string;
        sizeBytes: number;
    }[];
}

export function usePresignProofUpload() {
    return useMutation({
        mutationFn: ({ jobId, files }: PresignRequest) =>
            api.post<PresignResponse>(endpoints.storage.proofPresign, { jobId, files }),
        onError: (error: any) => {
            toast.error(error.message || 'Failed to get upload URLs');
        },
    });
}

export function useSubmitProof() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ jobId, proofs }: SubmitProofRequest) =>
            api.post(endpoints.storage.proofConfirm, { jobId, proofs }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
            toast.success('Proof submitted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit proof');
        },
    });
}
