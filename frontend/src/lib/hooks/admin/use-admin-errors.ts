
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface ErrorLog {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    message: string;
    stack?: string;
    path?: string;
    method?: string;
    createdAt: string;
    user?: {
        id: string;
        email: string;
        fullName: string;
        role: string;
    };
    ipAddress?: string;
    userAgent?: string;
    safePayload?: any;
}

export interface ErrorLogFilter {
    severity?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
}

export function useAdminErrorLogs(filters?: ErrorLogFilter) {
    return useQuery({
        queryKey: ['admin', 'system', 'errors', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.severity && filters.severity !== 'all') params.append('severity', filters.severity);
            if (filters?.q) params.append('q', filters.q);
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters?.dateTo) params.append('dateTo', filters.dateTo);
            if (filters?.page) params.append('page', filters.page.toString());

            const response = await api.get(`/admin/system/errors?${params.toString()}`);
            return response;
        },
    });
}

export function useAdminErrorLog(id: string) {
    return useQuery<ErrorLog>({
        queryKey: ['admin', 'system', 'errors', id],
        queryFn: async () => {
            return await api.get(`/admin/system/errors/${id}`);
        },
        enabled: !!id,
    });
}
