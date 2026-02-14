/**
 * Upload file to presigned URL with progress tracking
 * Uses XMLHttpRequest for progress events
 */

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface UploadResult {
    success: boolean;
    error?: string;
}

export async function uploadToSignedUrl(
    file: File,
    signedUrl: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100),
                });
            }
        });

        // Success
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ success: true });
            } else {
                resolve({
                    success: false,
                    error: `Upload failed with status ${xhr.status}`,
                });
            }
        });

        // Error
        xhr.addEventListener('error', () => {
            resolve({
                success: false,
                error: 'Network error during upload',
            });
        });

        // Abort
        xhr.addEventListener('abort', () => {
            resolve({
                success: false,
                error: 'Upload cancelled',
            });
        });

        // Start upload
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

/**
 * Validate file before upload
 */
export interface FileValidation {
    valid: boolean;
    error?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

export function validateFile(file: File): FileValidation {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: JPEG, PNG, WebP`,
        };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large. Max size: 5MB`,
        };
    }

    return { valid: true };
}

export function validateFileList(files: File[]): FileValidation {
    if (files.length === 0) {
        return {
            valid: false,
            error: 'Please select at least one file',
        };
    }

    if (files.length > MAX_FILES) {
        return {
            valid: false,
            error: `Maximum ${MAX_FILES} files allowed`,
        };
    }

    // Validate each file
    for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
            return validation;
        }
    }

    return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
