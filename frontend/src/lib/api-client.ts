import axios from 'axios';

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    withCredentials: true,
});

// Interceptor to add auth token and elevated token if available
apiClient.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // Add main auth token
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Add elevated token if available
        const elevatedToken = localStorage.getItem('elevatedToken');
        if (elevatedToken && config.headers) {
            config.headers['x-elevated-token'] = elevatedToken;
        }
    }
    return config;
});

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If elevated token is invalid/expired, clear it
        if (error.response?.status === 401 && error.config.headers['x-elevated-token']) {
            localStorage.removeItem('elevatedToken');
        }
        return Promise.reject(error);
    }
);
