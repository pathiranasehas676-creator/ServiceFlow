import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';

export interface UserStats {
    totalSpentCents: number;
    totalJobs: number;
    activeJobs: number;
}

export function useUserStats() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadStats() {
        setIsLoading(true);
        try {
            const data = await api.get('/users/stats/spending');
            setStats(data);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch spending stats');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadStats();
    }, []);

    return { stats, isLoading, error, refresh: loadStats };
}
