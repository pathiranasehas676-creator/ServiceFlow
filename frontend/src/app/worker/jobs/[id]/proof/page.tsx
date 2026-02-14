'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadQueue, UploadFile, FileUploadState } from '@/components/UploadQueue';
import { StepTimeline } from '@/components/StepTimeline';
import { useJobDetails } from '@/lib/hooks/useJobDetails';
import { usePresignProofUpload, useSubmitProof } from '@/lib/hooks/useProofUpload';
import { validateFileList, uploadToSignedUrl, UploadProgress } from '@/lib/utils/uploadToSignedUrl';
import { toast } from 'sonner';

export default function ProofUploadPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const { data: job, isLoading: isLoadingJob } = useJobDetails(jobId);
    const presignMutation = usePresignProofUpload();
    const submitMutation = useSubmitProof();

    // Check if job is in correct status
    const canUploadProof = job?.status === 'ARRIVED';
    const needsArrival = job?.status === 'ACCEPTED';

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);

        // Validate files
        const validation = validateFileList(selectedFiles);
        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        // Check total count
        if (uploadFiles.length + selectedFiles.length > 5) {
            toast.error('Maximum 5 files allowed');
            return;
        }

        // Add files to queue
        const newFiles: UploadFile[] = selectedFiles.map((file) => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
            state: 'queued' as FileUploadState,
            progress: 0,
        }));

        setUploadFiles((prev) => [...prev, ...newFiles]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (id: string) => {
        setUploadFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleRetryFile = async (id: string) => {
        const file = uploadFiles.find((f) => f.id === id);
        if (!file) return;

        // Reset file state
        setUploadFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, state: 'queued' as FileUploadState, progress: 0, error: undefined } : f))
        );

        // Retry upload
        await uploadSingleFile(file);
    };

    const uploadSingleFile = async (uploadFile: UploadFile) => {
        const { id, file } = uploadFile;

        try {
            // Update state to uploading
            setUploadFiles((prev) =>
                prev.map((f) => (f.id === id ? { ...f, state: 'uploading' as FileUploadState } : f))
            );

            // Get presigned URL
            const presignResult = await presignMutation.mutateAsync({
                jobId,
                files: [{ mimeType: file.type, sizeBytes: file.size }],
            });

            const { objectKey, putUrl } = presignResult.uploads[0];

            // Upload to MinIO
            const uploadResult = await uploadToSignedUrl(file, putUrl, (progress: UploadProgress) => {
                setUploadFiles((prev) =>
                    prev.map((f) => (f.id === id ? { ...f, progress: progress.percentage } : f))
                );
            });

            if (uploadResult.success) {
                // Mark as success
                setUploadFiles((prev) =>
                    prev.map((f) =>
                        f.id === id
                            ? { ...f, state: 'success' as FileUploadState, progress: 100, objectKey }
                            : f
                    )
                );
            } else {
                throw new Error(uploadResult.error);
            }
        } catch (error: any) {
            setUploadFiles((prev) =>
                prev.map((f) =>
                    f.id === id
                        ? { ...f, state: 'failed' as FileUploadState, error: error.message }
                        : f
                )
            );
        }
    };

    const handleStartUpload = async () => {
        if (uploadFiles.length === 0) {
            toast.error('Please select at least one file');
            return;
        }

        setIsUploading(true);

        // Upload all files sequentially
        for (const uploadFile of uploadFiles) {
            if (uploadFile.state === 'queued') {
                await uploadSingleFile(uploadFile);
            }
        }

        setIsUploading(false);
    };

    const handleSubmitProof = async () => {
        const successfulUploads = uploadFiles.filter((f) => f.state === 'success' && f.objectKey);

        if (successfulUploads.length === 0) {
            toast.error('No successful uploads to submit');
            return;
        }
        const proofs = successfulUploads.map((f) => ({
            objectKey: f.objectKey!,
            mimeType: f.file.type,
            sizeBytes: f.file.size,
        }));

        await submitMutation.mutateAsync({ jobId, proofs });

        // Redirect back to job details
        router.push(`/worker/jobs/${jobId}`);
    };

    const allUploadsSuccessful = uploadFiles.length > 0 && uploadFiles.every((f) => f.state === 'success');
    const hasFailedUploads = uploadFiles.some((f) => f.state === 'failed');

    if (isLoadingJob) {
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="container max-w-4xl mx-auto py-8">
                <Alert variant="destructive">
                    <AlertDescription>Job not found</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <p className="text-sm text-gray-500">Upload proof of completion</p>
                </div>
            </div>

            {/* Timeline */}
            <Card>
                <CardContent className="pt-6">
                    <StepTimeline currentStatus={job.status} />
                </CardContent>
            </Card>

            {/* Status Check */}
            {needsArrival && (
                <Alert>
                    <AlertDescription>
                        You need to mark yourself as arrived before uploading proof.
                        <Button
                            variant="link"
                            className="ml-2"
                            onClick={() => router.push(`/worker/jobs/${jobId}/arrived`)}
                        >
                            Go to Arrival Page
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {!canUploadProof && !needsArrival && (
                <Alert>
                    <AlertDescription>
                        Proof upload is not available for jobs in {job.status} status.
                    </AlertDescription>
                </Alert>
            )}

            {/* Upload UI */}
            {canUploadProof && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Proof Images</CardTitle>
                            <CardDescription>
                                Upload 1-5 images showing job completion (JPEG, PNG, or WebP, max 5MB each)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* File Input */}
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={isUploading || uploadFiles.length >= 5}
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || uploadFiles.length >= 5}
                                    className="w-full h-32 border-dashed"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm font-medium">
                                            {uploadFiles.length >= 5 ? 'Maximum files reached' : 'Click to select images'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            JPEG, PNG, WebP • Max 5MB each • Up to 5 files
                                        </span>
                                    </div>
                                </Button>
                            </div>

                            {/* Upload Queue */}
                            <UploadQueue
                                files={uploadFiles}
                                onRemove={handleRemoveFile}
                                onRetry={handleRetryFile}
                                disabled={isUploading}
                            />

                            {/* Actions */}
                            {uploadFiles.length > 0 && (
                                <div className="flex gap-3">
                                    {!allUploadsSuccessful && (
                                        <Button
                                            onClick={handleStartUpload}
                                            disabled={isUploading || allUploadsSuccessful}
                                            className="flex-1"
                                        >
                                            {isUploading ? 'Uploading...' : 'Start Upload'}
                                        </Button>
                                    )}
                                    {allUploadsSuccessful && (
                                        <Button
                                            onClick={handleSubmitProof}
                                            disabled={submitMutation.isPending}
                                            className="flex-1"
                                        >
                                            {submitMutation.isPending ? 'Submitting...' : 'Submit Proof'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {hasFailedUploads && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Some uploads failed. Please retry or remove failed files.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
