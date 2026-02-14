'use client';

import { X, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/utils/uploadToSignedUrl';

export type FileUploadState = 'queued' | 'uploading' | 'success' | 'failed';

export interface UploadFile {
    id: string;
    file: File;
    state: FileUploadState;
    progress: number;
    error?: string;
    objectKey?: string;
}

interface UploadQueueProps {
    files: UploadFile[];
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
    disabled?: boolean;
}

export function UploadQueue({ files, onRemove, onRetry, disabled }: UploadQueueProps) {
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Upload Queue ({files.length}/5)</h3>
            <div className="space-y-2">
                {files.map((uploadFile) => (
                    <UploadFileItem
                        key={uploadFile.id}
                        uploadFile={uploadFile}
                        onRemove={onRemove}
                        onRetry={onRetry}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
}

function UploadFileItem({
    uploadFile,
    onRemove,
    onRetry,
    disabled,
}: {
    uploadFile: UploadFile;
    onRemove: (id: string) => void;
    onRetry: (id: string) => void;
    disabled?: boolean;
}) {
    const { id, file, state, progress, error } = uploadFile;

    const getStateIcon = () => {
        switch (state) {
            case 'queued':
                return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
            case 'uploading':
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
        }
    };

    const getStateColor = () => {
        switch (state) {
            case 'queued':
                return 'bg-gray-100';
            case 'uploading':
                return 'bg-blue-50';
            case 'success':
                return 'bg-green-50';
            case 'failed':
                return 'bg-red-50';
        }
    };

    return (
        <div className={`p-4 rounded-lg border ${getStateColor()} transition-colors`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStateIcon()}</div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                            </p>
                        </div>

                        <div className="flex items-center gap-1">
                            {state === 'failed' && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onRetry(id)}
                                    disabled={disabled}
                                    className="h-7 px-2"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                </Button>
                            )}
                            {(state === 'queued' || state === 'failed') && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onRemove(id)}
                                    disabled={disabled}
                                    className="h-7 px-2"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {state === 'uploading' && (
                        <div className="mt-2">
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
                        </div>
                    )}

                    {state === 'failed' && error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                    )}

                    {state === 'success' && (
                        <p className="text-xs text-green-600 mt-1">Upload complete</p>
                    )}
                </div>
            </div>
        </div>
    );
}
