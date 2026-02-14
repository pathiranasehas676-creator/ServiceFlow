'use client';

import * as React from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';
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
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function SecurityAlertsPage() {
    const [alerts, setAlerts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchAlerts = async () => {
        try {
            const response = await apiClient.get('/admin/security-alerts');
            setAlerts(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch security alerts');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAlerts();
    }, []);

    const resolveAlert = async (id: string) => {
        try {
            await apiClient.post(`/admin/security-alerts/${id}/resolve`);
            toast.success('Alert resolved');
            fetchAlerts();
        } catch (error) {
            toast.error('Failed to resolve alert');
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-destructive text-destructive-foreground';
            case 'HIGH': return 'bg-orange-500 text-white';
            case 'MEDIUM': return 'bg-yellow-500 text-black';
            default: return 'bg-blue-500 text-white';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Security Alerts</h1>
                <p className="text-muted-foreground">Monitor system-wide security events and suspicious activities.</p>
            </div>

            <div className="space-y-4">
                {alerts.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <p className="text-lg font-medium">No active security alerts</p>
                        <p className="text-sm text-muted-foreground">System is operating within normal security parameters.</p>
                    </div>
                )}

                {alerts.map((alert) => (
                    <Card key={alert.id} className={alert.isResolved ? 'opacity-60 grayscale' : 'border-l-4 border-l-destructive shadow-lg transition-all hover:shadow-xl'}>
                        <CardHeader className="flex flex-row items-start space-y-0 gap-4">
                            <div className={`p-3 rounded-xl ${getSeverityColor(alert.severity)}`}>
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold">{alert.title}</CardTitle>
                                    <div className="flex gap-2">
                                        <Badge variant={alert.isResolved ? 'secondary' : 'destructive'}>
                                            {alert.isResolved ? 'RESOLVED' : 'ACTIVE'}
                                        </Badge>
                                    </div>
                                </div>
                                <CardDescription className="mt-2 text-base">
                                    {alert.description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-b mb-4">
                                <div className="flex flex-wrap gap-6 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block mb-1">Type</span>
                                        <span className="font-mono bg-muted px-2 py-0.5 rounded">{alert.type}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block mb-1">User Affected</span>
                                        <span className="font-medium">{alert.user?.email || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block mb-1">Detected At</span>
                                        <span className="font-medium">{format(new Date(alert.createdAt), 'PPp')}</span>
                                    </div>
                                </div>
                                {!alert.isResolved && (
                                    <Button size="default" onClick={() => resolveAlert(alert.id)}>
                                        Mark as Resolved
                                    </Button>
                                )}
                            </div>
                            {alert.metadata && (
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Technical Metadata</h4>
                                    <pre className="p-4 bg-slate-950 text-slate-50 rounded-lg text-[11px] overflow-auto max-h-48 scrollbar-thin">
                                        {JSON.stringify(alert.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
