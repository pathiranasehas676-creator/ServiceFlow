'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X, Check, FileText } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

interface PayoutReceiptUploadProps {
    payoutId: string;
    onUploadComplete: (fileKey: string, mimeType: string, sizeBytes: number) => void;
}

export function PayoutReceiptUpload({ payoutId, onUploadComplete }: PayoutReceiptUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setUploadError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            // 1. Get presigned URL
            const presignRes = await api.post(`/payouts/admin/${payoutId}/receipt/presign`, {
                mimeType: file.type,
                size: file.size,
            });

            const { uploadUrl, fileKey } = presignRes.data;

            // 2. Upload to S3/MinIO
            const uploadRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            if (!uploadRes.ok) {
                throw new Error('Upload failed');
            }

            // 3. Notify parent
            onUploadComplete(fileKey, file.type, file.size);
            toast.success('Receipt uploaded successfully');
            setFile(null); // Clear file after success? Or keep it? keeping it might lock UI state if parent handles it.
        } catch (error) {
            console.error(error);
            setUploadError('Failed to upload receipt. Please try again.');
            toast.error('Failed to upload receipt');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                {!file ? (
                    <label className="cursor-pointer block">
                        <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <div className="text-sm font-medium text-slate-700">Click to select receipt</div>
                        <div className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (Max 5MB)</div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                        />
                    </label>
                ) : (
                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-indigo-500" />
                            <div className="text-left">
                                <div className="text-sm font-medium truncate max-w-[200px]">{file.name}</div>
                                <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFile(null)}
                            disabled={isUploading}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {uploadError && (
                <div className="text-xs text-red-600 font-medium">{uploadError}</div>
            )}

            <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full"
            >
                {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                    'Upload & Attach'
                )}
            </Button>
        </div>
    );
}
