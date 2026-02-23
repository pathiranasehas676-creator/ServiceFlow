'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/apiClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResendLink, setShowResendLink] = useState(false);

    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowResendLink(false);
        setIsLoading(true);

        try {
            // 1. Login
            const loginRes = await api.post('/auth/login', { email, password });
            const token = loginRes.accessToken;
            localStorage.setItem('token', token);

            // 2. Fetch User Details (Role)
            // Note: The me info is often returned in login, but we'll follow existing pattern
            const user = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Set Cookie for Middleware (mocking Zustand persist structure)
            const authState = {
                state: {
                    isAuthenticated: true,
                    user: user,
                    token: token
                },
                version: 0
            };
            // Set cookie valid for 7 days
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);
            document.cookie = `auth-storage=${JSON.stringify(authState)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

            // 4. Redirect based on Role
            if (user.role === 'ADMIN') {
                router.push('/admin/dashboard');
            } else if (user.role === 'WORKER') {
                router.push('/worker/dashboard');
            } else if (user.role === 'STAFF') {
                router.push('/staff/dashboard');
            } else {
                router.push('/dashboard');
            }

        } catch (err: any) {
            console.error('Login error:', err);

            let msg = 'Login failed.';

            if (err instanceof ApiError) {
                msg = err.message;
            } else if (err.response?.data?.message) {
                // Fallback for any remaining axios/fetch errors
                const errorData = err.response.data;
                msg = Array.isArray(errorData.message)
                    ? errorData.message.join(', ')
                    : errorData.message;
            } else if (err.message) {
                msg = err.message;
            }

            setError(msg);

            // Check for unverified email error
            if (msg && (msg.toLowerCase().includes('email not verified'))) {
                setShowResendLink(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                        <p className="text-gray-500 mt-2">Sign in to your account</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                    {showResendLink && (
                                        <Link href="/auth/resend-verification" className="block mt-2 text-sm font-medium text-red-700 hover:text-red-600 underline">
                                            Resend verification email?
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <Link href="/auth/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-500">Don't have an account? </span>
                        <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
