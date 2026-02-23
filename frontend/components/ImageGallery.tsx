'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ExternalLink, Download, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSignedPreviewUrls } from '@/lib/hooks/useSignedPreviewUrl';
import { formatFileSize } from '@/lib/utils/uploadToSignedUrl';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageGalleryProps {
    objectKeys: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialIndex?: number;
    metadata?: Record<string, { mimeType?: string; sizeBytes?: number; uploadedAt?: string }>;
}

export function ImageGallery({
    objectKeys,
    open,
    onOpenChange,
    initialIndex = 0,
    metadata = {},
}: ImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [imageError, setImageError] = useState(false);

    // Fetch all signed URLs when modal opens
    const { data: signedUrls, isLoading, refetch } = useSignedPreviewUrls(objectKeys, open);

    // Reset index when modal opens
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
            setImageError(false);
        }
    }, [open, initialIndex]);

    const currentObjectKey = objectKeys[currentIndex];
    const currentSignedData = signedUrls?.[currentIndex];
    const currentMetadata = metadata[currentObjectKey] || {};

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : objectKeys.length - 1));
        setImageError(false);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < objectKeys.length - 1 ? prev + 1 : 0));
        setImageError(false);
    };

    const handleOpenInNewTab = () => {
        if (currentSignedData && 'getUrl' in currentSignedData) {
            window.open(currentSignedData.getUrl, '_blank');
        }
    };

    const handleDownload = async () => {
        if (currentSignedData && 'getUrl' in currentSignedData) {
            try {
                const response = await fetch(currentSignedData.getUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `image-${currentIndex + 1}.${currentMetadata.mimeType?.split('/')[1] || 'jpg'}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Download failed:', error);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] p-0">
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle>
                            Image {currentIndex + 1} of {objectKeys.length}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {currentSignedData && 'getUrl' in currentSignedData && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleDownload}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleOpenInNewTab}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Open
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 relative bg-gray-100 flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            <p className="text-sm text-gray-500">Loading preview...</p>
                        </div>
                    ) : currentSignedData && 'getUrl' in currentSignedData && !imageError ? (
                        <div className="relative w-full h-full p-6">
                            <Image
                                src={currentSignedData.getUrl}
                                alt={`Image ${currentIndex + 1}`}
                                fill
                                className="object-contain"
                                onError={() => setImageError(true)}
                                unoptimized
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-sm text-red-600">Failed to load image</p>
                            <Button size="sm" onClick={() => refetch()}>
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Navigation */}
                    {objectKeys.length > 1 && (
                        <>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                                onClick={handlePrevious}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="secondary"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                                onClick={handleNext}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Metadata */}
                <div className="p-6 pt-4 border-t bg-white">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">File Type</p>
                            <p className="font-medium">
                                {currentMetadata.mimeType?.split('/')[1]?.toUpperCase() ||
                                    currentSignedData && 'mimeType' in currentSignedData
                                    ? currentSignedData?.mimeType?.split('/')[1]?.toUpperCase()
                                    : 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">File Size</p>
                            <p className="font-medium">
                                {currentMetadata.sizeBytes
                                    ? formatFileSize(currentMetadata.sizeBytes)
                                    : currentSignedData && 'sizeBytes' in currentSignedData
                                        ? formatFileSize(currentSignedData?.sizeBytes || 0)
                                        : 'Unknown'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Uploaded</p>
                            <p className="font-medium">
                                {currentMetadata.uploadedAt
                                    ? new Date(currentMetadata.uploadedAt).toLocaleDateString()
                                    : 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Thumbnails */}
                {objectKeys.length > 1 && (
                    <div className="p-6 pt-0 flex gap-2 overflow-x-auto">
                        {objectKeys.map((key, index) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setImageError(false);
                                }}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {signedUrls?.[index] && 'getUrl' in signedUrls[index] ? (
                                    <Image
                                        src={signedUrls[index].getUrl}
                                        alt={`Thumbnail ${index + 1}`}
                                        width={64}
                                        height={64}
                                        className="object-cover w-full h-full"
                                        unoptimized
                                    />
                                ) : (
                                    <Skeleton className="w-full h-full" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
