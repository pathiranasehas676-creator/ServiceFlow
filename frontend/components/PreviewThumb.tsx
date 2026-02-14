'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { useSignedPreviewUrl } from '@/lib/hooks/useSignedPreviewUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PreviewThumbProps {
    objectKey: string | null | undefined;
    alt?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
};

export function PreviewThumb({
    objectKey,
    alt = 'Preview',
    className,
    size = 'md',
    onClick,
}: PreviewThumbProps) {
    const [imageError, setImageError] = useState(false);
    const { data, isLoading, error, refetch } = useSignedPreviewUrl(objectKey);

    const handleRetry = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageError(false);
        refetch();
    };

    // Loading state
    if (isLoading) {
        return (
            <Skeleton
                className={cn(
                    'rounded-lg',
                    sizeClasses[size],
                    className
                )}
            />
        );
    }

    // Error state or no object key
    if (error || !objectKey || !data?.getUrl || imageError) {
        return (
            <div
                className={cn(
                    'rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-1',
                    sizeClasses[size],
                    onClick && 'cursor-pointer hover:bg-gray-100',
                    className
                )}
                onClick={onClick}
            >
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRetry}
                    className="h-6 px-2 text-xs"
                >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                </Button>
            </div>
        );
    }

    // Success state
    return (
        <div
            className={cn(
                'relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100',
                sizeClasses[size],
                onClick && 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all',
                className
            )}
            onClick={onClick}
        >
            <Image
                src={data.getUrl}
                alt={alt}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized // Signed URLs change frequently
            />
        </div>
    );
}

/**
 * Thumbnail stack for multiple images
 */
interface PreviewThumbStackProps {
    objectKeys: string[];
    maxVisible?: number;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

export function PreviewThumbStack({
    objectKeys,
    maxVisible = 3,
    size = 'sm',
    onClick,
}: PreviewThumbStackProps) {
    const visibleKeys = objectKeys.slice(0, maxVisible);
    const remainingCount = objectKeys.length - maxVisible;

    if (objectKeys.length === 0) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <ImageIcon className="w-4 h-4" />
                <span>No images</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <div className="flex -space-x-2">
                {visibleKeys.map((objectKey, index) => (
                    <div
                        key={objectKey}
                        className="relative"
                        style={{ zIndex: visibleKeys.length - index }}
                    >
                        <PreviewThumb
                            objectKey={objectKey}
                            size={size}
                            onClick={onClick}
                            className="ring-2 ring-white"
                        />
                    </div>
                ))}
            </div>
            {remainingCount > 0 && (
                <div
                    className={cn(
                        'rounded-lg bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600',
                        sizeClasses[size]
                    )}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
}
