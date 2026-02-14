/**
 * API Endpoint paths for ServiceFlow Backend
 */

export const endpoints = {
    // ============================================
    // AUTH
    // ============================================
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        me: '/auth/me',
        verify2FA: '/auth/2fa/verify',
    },

    // ============================================
    // ADMIN - DASHBOARD
    // ============================================
    admin: {
        dashboard: {
            kpis: '/admin/dashboard/kpis',
        },

        // ============================================
        // VERIFICATIONS
        // ============================================
        verifications: {
            list: '/admin/verifications',
            approve: (id: string) => `/admin/verifications/${id}/approve`,
            reject: (id: string) => `/admin/verifications/${id}/reject`,
            details: (id: string) => `/admin/verifications/${id}`,
        },

        // ============================================
        // PROOFS
        // ============================================
        proofs: {
            list: '/admin/proofs',
            approve: (id: string) => `/admin/proofs/${id}/approve`,
            reject: (id: string) => `/admin/proofs/${id}/reject`,
            details: (id: string) => `/admin/proofs/${id}`,
        },

        // ============================================
        // PAYOUTS
        // ============================================
        payouts: {
            list: '/admin/payouts',
            approve: (id: string) => `/admin/payouts/${id}/approve`,
            reject: (id: string) => `/admin/payouts/${id}/reject`,
            markPaid: (id: string) => `/admin/payouts/${id}/mark-paid`,
            details: (id: string) => `/admin/payouts/${id}`,
        },

        // ============================================
        // USERS
        // ============================================
        users: {
            list: '/admin/users',
            details: (id: string) => `/admin/users/${id}`,
            suspend: (id: string) => `/admin/users/${id}/suspend`,
            unsuspend: (id: string) => `/admin/users/${id}/unsuspend`,
            blacklist: (id: string) => `/admin/users/${id}/blacklist`,
            createStaff: '/admin/staff',
        },

        // ============================================
        // SERVICES
        // ============================================
        services: {
            list: '/admin/services',
            create: '/admin/services',
            update: (id: string) => `/admin/services/${id}`,
            delete: (id: string) => `/admin/services/${id}`,
            details: (id: string) => `/admin/services/${id}`,
        },

        // ============================================
        // AUDIT LOGS
        // ============================================
        auditLogs: {
            list: '/admin/audit-logs',
        },

        // ============================================
        // SETTINGS
        // ============================================
        settings: {
            get: '/admin/settings',
            update: '/admin/settings',
        },

        // ============================================
        // EXPORTS
        // ============================================
        exports: {
            jobs: '/admin/exports/jobs.csv',
            payouts: '/admin/exports/payouts.csv',
            users: '/admin/exports/users.csv',
        },
    },

    // ============================================
    // STORAGE
    // ============================================
    storage: {
        preview: '/storage/preview',
        idPresign: '/storage/id/presign',
        idConfirm: '/storage/id/confirm',
        proofPresign: '/storage/proof/presign',
        proofConfirm: '/storage/proof/confirm',
    },

    // ============================================
    // JOBS (Worker/Staff)
    // ============================================
    jobs: {
        available: '/jobs/available',
        accept: (id: string) => `/jobs/${id}/accept`,
        arrive: (id: string) => `/jobs/${id}/arrive`,
        proofPresign: (id: string) => `/jobs/${id}/proof/presign`,
        proofSubmit: (id: string) => `/jobs/${id}/proof/submit`,
        create: '/jobs',
        decide: (id: string) => `/jobs/${id}/decide`,
        list: '/jobs',
        details: (id: string) => `/jobs/${id}`,
    },
};

// Helper to build query strings
export function buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
}
