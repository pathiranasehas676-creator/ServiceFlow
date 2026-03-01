'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Check, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api/v1')
        ? process.env.NEXT_PUBLIC_API_URL
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1`)
    : 'http://localhost:3001/api/v1';

interface FileUploaderProps {
    label: string;
    onUploadComplete: (fileKey: string) => void;
    accept?: string;
    maxSizeMB?: number;
    disabled?: boolean;
    purpose?: 'ID' | 'PROFILE' | 'PROOF';
    side?: 'FRONT' | 'BACK' | 'SELFIE' | 'PROFILE' | 'PROOF';
    jobId?: string;
}

export function FileUploader({
    label,
    onUploadComplete,
    accept = 'image/*',
    maxSizeMB = 5,
    disabled = false,
    purpose = 'ID',
    side = 'FRONT',
    jobId,
}: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedKey, setUploadedKey] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > maxSizeMB * 1024 * 1024) {
                toast.error(`File too large (max ${maxSizeMB}MB)`);
                return;
            }
            setFile(selectedFile);
            setUploadedKey(null);
        }
    };

    const uploadFile = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            // Get auth token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('You must be logged in to upload files');
                return;
            }

            // Build FormData
            const formData = new FormData();
            formData.append('file', file);

            // Map purpose/side to the query param
            const purposeParam = side || purpose;
            const url = `${API_BASE_URL}/storage/upload?side=${purposeParam}${jobId ? `&jobId=${jobId}` : ''}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: 'Upload failed' }));
                throw new Error(err.message || `Upload failed (${response.status})`);
            }

            const data = await response.json();
            const objectKey = data.objectKey;

            setUploadedKey(objectKey);
            onUploadComplete(objectKey);
            toast.success('File uploaded successfully');
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error?.message || 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <div className={cn(
                "mt-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors min-h-[140px]",
                uploadedKey ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-indigo-300',
                disabled && !uploadedKey && "bg-slate-50 border-slate-100 opacity-60"
            )}>
                {uploadedKey ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-800">UPLOADED</span>
                        {!disabled && (
                            <Button variant="ghost" size="sm" onClick={() => { setFile(null); setUploadedKey(null); }} className="h-8 text-xs">
                                <X className="h-3 w-3 mr-1" /> Replace
                            </Button>
                        )}
                    </div>
                ) : isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                        <span className="text-xs font-medium text-slate-500">Uploading...</span>
                    </div>
                ) : file ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-medium truncate max-w-[150px]">{file.name}</span>
                        </div>
                        {!disabled && (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={uploadFile} className="bg-indigo-600 h-8 text-xs font-bold">
                                    START UPLOAD
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setFile(null)} className="h-8 text-xs">
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <label className={cn(
                        "flex flex-col items-center gap-2 w-full h-full py-4 transition-opacity",
                        disabled ? "cursor-not-allowed" : "cursor-pointer"
                    )}>
                        <Upload className="h-8 w-8 text-slate-300" />
                        <span className="text-xs font-medium text-slate-500">
                            {disabled ? 'Submission Locked' : 'Click to select file'}
                        </span>
                        {!disabled && <input type="file" className="hidden" accept={accept} onChange={handleFileChange} />}
                    </label>
                )}
            </div>
        </div>
    );
}
