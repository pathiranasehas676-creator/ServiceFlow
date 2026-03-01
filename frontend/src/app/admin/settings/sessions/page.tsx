'use client';

import * as React from 'react';
import { Smartphone, Globe } from 'lucide-react';
import { format } from 'date-fns';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

export default function SessionsPage() {
    const [sessions, setSessions] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchSessions = async () => {
        try {
            const data = await api.get('/auth/sessions');
            setSessions(data || []);
        } catch (error) {
            toast.error('Failed to fetch sessions');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchSessions();
    }, []);

    const revokeSession = async (id: string) => {
        try {
            await api.post(`/auth/sessions/${id}/revoke`);
            toast.success('Session revoked');
            fetchSessions();
        } catch (error) {
            toast.error('Failed to revoke session');
        }
    };

    const revokeAll = async () => {
        try {
            await api.post('/auth/sessions/revoke-all');
            toast.success('Other sessions revoked');
            fetchSessions();
        } catch (error) {
            toast.error('Failed to revoke all sessions');
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Active Sessions</h1>
                    <p className="text-muted-foreground">Security control center for your active devices.</p>
                </div>
                <Button variant="destructive" onClick={revokeAll}>
                    Revoke All Other Sessions
                </Button>
            </div>

            <div className="grid gap-4">
                {sessions.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                        No active sessions found.
                    </div>
                )}
                {sessions.map((session) => (
                    <Card key={session.id} className={session.revokedAt ? 'opacity-50' : 'border-l-4 border-l-primary'}>
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <div className="flex-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {session.userAgent.includes('Mobile') ? <Smartphone className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
                                    <span className="truncate max-w-md">{session.userAgent}</span>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <span>IP: {session.ipAddress}</span>
                                    {session.revokedAt && <Badge variant="secondary">Revoked</Badge>}
                                    {!session.revokedAt && <Badge variant="default" className="bg-green-600">Active</Badge>}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Last active: {format(new Date(session.lastActiveAt), 'PPp')}
                                </div>
                                {!session.revokedAt && (
                                    <Button variant="outline" size="sm" onClick={() => revokeSession(session.id)}>
                                        Revoke
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
