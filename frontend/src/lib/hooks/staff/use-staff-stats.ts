import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';

export interface DashboardStats {
    totalUsers: number;
    totalJobs: number;
    totalPayoutsCents: number;
    pendingProofs: number;
    pendingPayouts: number;
    pendingIdVerifications: number;
    pendingBankVerifications: number;
    openTickets: number;
    completedJobs: number;
    onlineWorkers: number;
}

export function useStaffStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadData() {
        setIsLoading(true);
        try {
            const [basicStats, logs] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/audit-logs'),
            ]);
            setStats(basicStats);
            setAuditLogs(logs);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch staff operations data.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    return { stats, auditLogs, isLoading, error, refresh: loadData };
}
