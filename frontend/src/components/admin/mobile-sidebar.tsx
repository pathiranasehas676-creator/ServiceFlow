'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { AdminSidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileAdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileAdminSidebar({ isOpen, onClose }: MobileAdminSidebarProps) {
    const pathname = usePathname();

    // Close on route change
    useEffect(() => {
        onClose();
    }, [pathname, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex md:hidden',
                isOpen ? 'pointer-events-auto' : 'pointer-events-none'
            )}
        >
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/80 transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0'
                )}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <div
                className={cn(
                    'relative flex h-full w-full max-w-xs flex-1 flex-col bg-background transition-transform duration-300 ease-in-out',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="absolute right-2 top-2">
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close sidebar</span>
                    </Button>
                </div>

                {/* Re-use the existing sidebar content logic */}
                {/* But AdminSidebar is built as a desktop component. 
                    We should either extract the Nav logic or wrap it.
                    Since AdminSidebar has 'hidden md:flex' we need to override that or create a wrapper.
                */}
                <div className="h-full pt-10">
                    {/* We can reuse AdminSidebar but we need to ensure it's visible. 
                        The AdminSidebar component has 'hidden md:flex' class. 
                        We need to force it to show. 
                        If we can't modify class via props, we might need to duplicate nav logic or update AdminSidebar to accept className prop.
                    */}
                    <div className="flex h-full flex-col">
                        <AdminSidebar className="flex w-full border-none shadow-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
