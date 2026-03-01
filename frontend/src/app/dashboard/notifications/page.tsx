'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, MailOpen, Clock, Bell, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
    const { notifications, isLoading, markRead, markAllRead, unreadCount } = useNotifications();
    const router = useRouter();

    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) {
            markRead(notification.id);
        }

        // Navigate based on entity type
        if (notification.metadata?.type === 'JOB' && notification.metadata?.id) {
            // Check if user is worker or creator? 
            // The path /jobs/:id works for both if we have a shared page, 
            // but currently /worker/jobs/:id and maybe /dashboard/jobs/:id?
            // Actually JobsController has getJob at /jobs/:id.
            // But frontend page?
            // For now, let's just mark read. 
            // If we have a link, we can use it.
            // Assuming /jobs/:id exists or we'll add it later.
            // router.push(`/jobs/${notification.metadata.id}`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">Stay updated on your service requests and jobs.</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={() => markAllRead()}>
                        <MailOpen className="mr-2 h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" />
                    ))}
                </div>
            ) : notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map((notification: any) => (
                        <Card
                            key={notification.id}
                            className={cn(
                                "cursor-pointer transition-colors hover:bg-slate-50",
                                !notification.isRead ? "border-l-4 border-l-indigo-500 bg-indigo-50/10" : "opacity-80"
                            )}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <CardContent className="p-4 flex gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                    !notification.isRead ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                                )}>
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold text-sm text-slate-900">
                                            {notification.title}
                                            {!notification.isRead && (
                                                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] bg-indigo-100 text-indigo-700 hover:bg-indigo-100">NEW</Badge>
                                            )}
                                        </p>
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <Clock className="mr-1 h-3 w-3" />
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-slate-50/50 border-dashed">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Bell className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No notifications yet</h3>
                    <p className="text-slate-500 max-w-sm mt-1">
                        When you have activity on your jobs or account updates, they will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
