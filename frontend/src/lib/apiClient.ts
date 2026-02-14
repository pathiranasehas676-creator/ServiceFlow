/**
 * API Client with automatic token refresh on 401
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public data?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

export async function fetchCsrfToken(): Promise<string> {
    if (csrfToken) return csrfToken;
    if (csrfPromise) return csrfPromise;

    csrfPromise = fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' })
        .then(async (res) => {
            if (!res.ok) throw new Error('Failed to fetch CSRF token');
            const data = await res.json();
            csrfToken = data.csrfToken || '';
            csrfPromise = null; // Clear promise so we can retry if needed
            return csrfToken || '';
        })
        .catch(() => {
            csrfPromise = null;
            return '';
        });
    return csrfPromise as Promise<string>;
}

async function refreshAccessToken(): Promise<string | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include', // Send HttpOnly refresh cookie
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Refresh failed');
        }

        const data = await response.json();
        return data.accessToken;
    } catch (error) {
        return null;
    }
}

export async function apiClient<T = any>(
    endpoint: string,
    options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;

    // Get access token from auth store (will be set up next)
    const getAccessToken = () => {
        if (typeof window === 'undefined') return null;
        // Check localStorage first (from login page)
        const localToken = localStorage.getItem('token');
        if (localToken) return localToken;

        // @ts-ignore - legacy auth store check
        return window.__authStore?.getState?.()?.accessToken || null;
    };

    const makeRequest = async (token: string | null): Promise<Response> => {
        const headers: any = {
            'Content-Type': 'application/json',
            ...(fetchOptions.headers || {}),
        };

        // Attach CSRF token for unsafe methods
        if (!['GET', 'HEAD', 'OPTIONS'].includes(fetchOptions.method?.toUpperCase() || 'GET')) {
            if (!csrfToken) await fetchCsrfToken();
            if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        }

        if (token && !skipAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            credentials: 'include', // Always include cookies for refresh token
            headers,
        });
    };

    let response = await makeRequest(getAccessToken());

    // Handle 401 - Attempt token refresh
    if (response.status === 401 && !skipAuth) {
        if (!isRefreshing) {
            isRefreshing = true;

            const newToken = await refreshAccessToken();

            if (newToken) {
                // Update token in store
                if (typeof window !== 'undefined') {
                    // @ts-ignore
                    window.__authStore?.getState?.()?.setAccessToken?.(newToken);
                }
                onTokenRefreshed(newToken);
                isRefreshing = false;

                // Retry original request with new token
                response = await makeRequest(newToken);
            } else {
                isRefreshing = false;
                onTokenRefreshed('');

                // Refresh failed - redirect to login
                if (typeof window !== 'undefined') {
                    // @ts-ignore
                    window.__authStore?.getState?.()?.logout?.();
                    window.location.href = '/auth/login';
                }
                throw new ApiError(401, 'Session expired. Please login again.');
            }
        } else {
            // Wait for ongoing refresh
            const newToken = await new Promise<string>((resolve) => {
                subscribeTokenRefresh((token) => resolve(token));
            });

            if (newToken) {
                response = await makeRequest(newToken);
            } else {
                throw new ApiError(401, 'Session expired. Please login again.');
            }
        }
    }

    // Parse response
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let errorData;

        try {
            errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // Response is not JSON
        }

        throw new ApiError(response.status, errorMessage, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        return null as T;
    }

    return response.json();
}

// Convenience methods
export const api = {
    get: <T = any>(endpoint: string, options?: RequestInit) =>
        apiClient<T>(endpoint, { ...options, method: 'GET' }),

    post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }),

    put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }),

    delete: <T = any>(endpoint: string, options?: RequestInit) =>
        apiClient<T>(endpoint, { ...options, method: 'DELETE' }),

    patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
        apiClient<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        }),
};
