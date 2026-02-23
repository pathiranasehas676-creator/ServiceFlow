'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { processQueue } from '@/lib/offline/sync-engine';

export default function PwaHandler() {
    const [isOffline, setIsOffline] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // 1. Offline Detection
        const handleOnline = () => {
            setIsOffline(false);
            toast.success("You are back online. Syncing pending actions...");
            processQueue();
        };
        const handleOffline = () => {
            setIsOffline(true);
            toast.warning("Internet connection lost. You are in offline mode.", {
                duration: 10000
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);

        // 2. Install Prompt Detection
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);

            // Only show banner if user hasn't dismissed it this session
            const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
            if (!dismissed) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowInstallBanner(false);
            setInstallPrompt(null);
        }
    };

    const dismissBanner = () => {
        setShowInstallBanner(false);
        sessionStorage.setItem('pwa-banner-dismissed', 'true');
    };

    return (
        <>
            {/* Offline Status Bar */}
            {isOffline && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Offline Mode Active</span>
                </div>
            )}

            {/* Premium Install Banner */}
            {showInstallBanner && (
                <div className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-8 md:w-96 animate-in slide-in-from-bottom-8 fade-in duration-500">
                    <div className="bg-indigo-600 rounded-2xl shadow-2xl p-6 text-white border border-white/20 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white/10 skew-x-12 transform origin-top-right group-hover:scale-110 transition-transform duration-700" />

                        <button
                            onClick={dismissBanner}
                            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                <Download className="h-6 w-6 text-indigo-600" />
                            </div>

                            <div>
                                <h4 className="text-lg font-black leading-tight">Install Flow App</h4>
                                <p className="text-white/80 text-sm font-medium">Add to your home screen for a premium, fast experience and offline access.</p>
                            </div>

                            <Button
                                onClick={handleInstall}
                                className="bg-white text-indigo-600 hover:bg-slate-50 font-black h-12 rounded-xl"
                            >
                                INSTALL NOW
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
