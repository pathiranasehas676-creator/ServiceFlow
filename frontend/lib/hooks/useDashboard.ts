import { useQuery } from '@tanstack/react-query';
import { api } from '../apiClient';
import { endpoints } from '../endpoints';

export interface DashboardKPIs {
    totalUsers: number;
    totalWorkers: number;
    activeJobs: number;
    completedJobs: number;
    pendingVerifications: number;
    pendingProofs: number;
    pendingPayouts: number;
    totalRevenue: number;
    revenueThisMonth: number;
    avgJobCompletionTime: number;
}

export function useDashboardKPIs() {
    return useQuery({
        queryKey: ['dashboard', 'kpis'],
        queryFn: () => api.get<DashboardKPIs>(endpoints.admin.dashboard.kpis),
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}
