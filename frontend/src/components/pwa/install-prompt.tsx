'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { toast } from 'sonner';

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if dismissed previously
        const isDismissed = localStorage.getItem('pwa_install_dismissed');
        if (isDismissed) return;

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
            setDeferredPrompt(null);
            toast.success('App installed successfully!');
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_install_dismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-50 bg-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 duration-500 max-w-sm">
            <div className="flex-1">
                <h3 className="font-bold text-sm">Install App</h3>
                <p className="text-xs text-indigo-100 mt-1">Add to home screen for offline access</p>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 font-bold text-xs bg-white text-indigo-600 hover:bg-slate-50"
                    onClick={handleInstallClick}
                >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Install
                </Button>
                <button
                    onClick={handleDismiss}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
