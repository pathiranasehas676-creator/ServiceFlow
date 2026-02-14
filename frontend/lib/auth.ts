import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'STAFF' | 'WORKER' | 'USER';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
}

interface AuthState {
    accessToken: string | null;
    user: User | null;
    isAuthenticated: boolean;

    // Actions
    setAccessToken: (token: string) => void;
    setUser: (user: User) => void;
    login: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            accessToken: null,
            user: null,
            isAuthenticated: false,

            setAccessToken: (token) => set({ accessToken: token }),

            setUser: (user) => set({ user, isAuthenticated: true }),

            login: (token, user) => set({
                accessToken: token,
                user,
                isAuthenticated: true
            }),

            logout: () => set({
                accessToken: null,
                user: null,
                isAuthenticated: false
            }),
        }),
        {
            name: 'auth-storage',
            // Only persist user info, not the access token (keep in memory)
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// Make auth store globally available for API client
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__authStore = useAuthStore;
}
