'use client';

import { useState } from 'react';
import { PreviewThumb } from './PreviewThumb';
import { ImageGallery } from './ImageGallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IDVerificationPreviewProps {
    frontObjectKey: string | null | undefined;
    backObjectKey: string | null | undefined;
    metadata?: {
        front?: { mimeType?: string; sizeBytes?: number; uploadedAt?: string };
        back?: { mimeType?: string; sizeBytes?: number; uploadedAt?: string };
    };
}

export function IDVerificationPreview({
    frontObjectKey,
    backObjectKey,
    metadata = {},
}: IDVerificationPreviewProps) {
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [initialIndex, setInitialIndex] = useState(0);

    const objectKeys = [frontObjectKey, backObjectKey].filter(Boolean) as string[];

    const galleryMetadata = {
        ...(frontObjectKey && { [frontObjectKey]: metadata.front || {} }),
        ...(backObjectKey && { [backObjectKey]: metadata.back || {} }),
    };

    const handleOpenGallery = (index: number) => {
        setInitialIndex(index);
        setGalleryOpen(true);
    };

    if (!frontObjectKey && !backObjectKey) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">ID Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No ID documents uploaded</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">ID Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Front */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600">Front Side</p>
                            {frontObjectKey ? (
                                <PreviewThumb
                                    objectKey={frontObjectKey}
                                    alt="ID Front"
                                    size="lg"
                                    onClick={() => handleOpenGallery(0)}
                                    className="w-full h-40"
                                />
                            ) : (
                                <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                    <p className="text-xs text-gray-400">Not uploaded</p>
                                </div>
                            )}
                        </div>

                        {/* Back */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-600">Back Side</p>
                            {backObjectKey ? (
                                <PreviewThumb
                                    objectKey={backObjectKey}
                                    alt="ID Back"
                                    size="lg"
                                    onClick={() => handleOpenGallery(frontObjectKey ? 1 : 0)}
                                    className="w-full h-40"
                                />
                            ) : (
                                <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                                    <p className="text-xs text-gray-400">Not uploaded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gallery Modal */}
            <ImageGallery
                objectKeys={objectKeys}
                open={galleryOpen}
                onOpenChange={setGalleryOpen}
                initialIndex={initialIndex}
                metadata={galleryMetadata}
            />
        </>
    );
}
