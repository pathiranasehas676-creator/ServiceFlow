'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle, FileImage, Loader2 } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';

interface UploadQueueProps {
    jobId: string;
    onUploadComplete: (urls: string[]) => void;
    maxFiles?: number;
}

interface UploadingFile {
    file: File;
    progress: number;
    url?: string;
    error?: string;
}

export function UploadQueue({ jobId, onUploadComplete, maxFiles = 3 }: UploadQueueProps) {
    const [files, setFiles] = useState<UploadingFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        if (files.length + selectedFiles.length > maxFiles) {
            toast.error(`You can only upload up to ${maxFiles} images`);
            return;
        }

        const newFiles = selectedFiles.map(file => ({ file, progress: 0 }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const startUpload = async () => {
        setIsProcessing(true);
        const uploadedUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                if (files[i].url) {
                    uploadedUrls.push(files[i].url!);
                    continue;
                }

                try {
                    // Update progress to show something is happening
                    setFiles(prev => {
                        const updated = [...prev];
                        updated[i].progress = 10;
                        return updated;
                    });

                    // 1. Get Presigned URL
                    const fileName = `${jobId}_${Date.now()}_${files[i].file.name}`;
                    const presignRes = await api.post(`/jobs/${jobId}/proof/presign`, {
                        fileName,
                        contentType: files[i].file.type
                    });

                    // Assuming presignRes is { uploadUrl, fileKey }
                    const { uploadUrl, fileKey } = presignRes;

                    setFiles(prev => {
                        const updated = [...prev];
                        updated[i].progress = 30;
                        return updated;
                    });

                    // 2. Upload to storage (e.g. MinIO/S3) using native fetch
                    const uploadRes = await fetch(uploadUrl, {
                        method: 'PUT',
                        body: files[i].file,
                        headers: {
                            'Content-Type': files[i].file.type
                        }
                    });

                    if (!uploadRes.ok) {
                        throw new Error(`Upload failed: ${uploadRes.statusText}`);
                    }

                    // Success
                    setFiles(prev => {
                        const updated = [...prev];
                        updated[i].progress = 100;
                        updated[i].url = fileKey;
                        return updated;
                    });

                    uploadedUrls.push(fileKey);

                } catch (fileErr) {
                    console.error('File upload error:', fileErr);
                    setFiles(prev => {
                        const updated = [...prev];
                        updated[i].error = 'Failed';
                        return updated;
                    });
                    throw fileErr; // Stop whole process or continue? Continue for others?
                    // For now, if one fails, we stop.
                }
            }

            onUploadComplete(uploadedUrls);
            toast.success('All images uploaded successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload one or more images');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                {files.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-xl border-2 border-slate-100 bg-slate-50 flex flex-col items-center justify-center p-4 overflow-hidden group">
                        {f.url ? (
                            <CheckCircle className="h-8 w-8 text-emerald-500" />
                        ) : (
                            <FileImage className="h-8 w-8 text-slate-300" />
                        )}
                        <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center px-2">{f.file.name}</span>

                        {!f.url && f.progress > 0 && (
                            <Progress value={f.progress} className="h-1 w-full absolute bottom-0 rounded-none bg-slate-200" />
                        )}

                        {!isProcessing && (
                            <button
                                onClick={() => removeFile(i)}
                                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:shadow transition-colors"
                                title="Remove"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                ))}

                {files.length < maxFiles && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                        <Upload className="h-8 w-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-xs font-bold text-slate-500 mt-2 group-hover:text-indigo-600">Add Photo</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileSelect} disabled={isProcessing} />
                    </label>
                )}
            </div>

            {files.length > 0 && !files.every(f => !!f.url) && (
                <Button
                    onClick={startUpload}
                    disabled={isProcessing}
                    className="w-full bg-slate-900 hover:bg-slate-800 font-bold h-11"
                >
                    {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : 'Upload All Images'}
                </Button>
            )}
        </div>
    );
}
