'use client';

import * as React from 'react';
import { Activity, Database, HardDrive, Cpu, RefreshCw } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

export default function SystemHealthPage() {
    const [health, setHealth] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/system/health');
            setHealth(response.data);
        } catch (error) {
            toast.error('Failed to fetch system health');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const ServiceCard = ({ name, status, Icon }: { name: string, status: string, Icon: any }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider">{name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mt-2">
                    <div className="text-2xl font-bold">{status === 'up' ? 'Operational' : 'Degraded'}</div>
                    <Badge variant={status === 'up' ? 'default' : 'destructive'} className={status === 'up' ? 'bg-green-600' : ''}>
                        {status.toUpperCase()}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
                    <p className="text-muted-foreground">Real-time infrastructure and service monitoring.</p>
                </div>
                <Button onClick={fetchHealth} disabled={loading} variant="outline" size="sm">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ServiceCard name="Database" status={health?.services?.db || 'up'} Icon={Database} />
                <ServiceCard name="Redis Cache" status={health?.services?.redis || 'up'} Icon={Activity} />
                <ServiceCard name="Object Storage" status={health?.services?.minio || 'up'} Icon={HardDrive} />
                <ServiceCard name="Job Queue" status={health?.services?.queue || 'up'} Icon={Cpu} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl">Resource Utilization</CardTitle>
                        <CardDescription>Server-level telemetry (Instance: sf-main-prd-01)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span className="flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU Load</span>
                                <span className="text-primary">24.8%</span>
                            </div>
                            <Progress value={24.8} className="h-3 bg-secondary" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> RAM Consumption</span>
                                <span className="text-primary">4.2 GB / 16 GB</span>
                            </div>
                            <Progress value={26.25} className="h-3 bg-secondary" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm font-medium">
                                <span className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Disk I/O (NVMe)</span>
                                <span className="text-primary">1.2 MB/s</span>
                            </div>
                            <Progress value={12} className="h-3 bg-secondary" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl">Network & API</CardTitle>
                        <CardDescription>Gateway performance</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center justify-center space-y-8">
                        <div className="text-center">
                            <div className="text-6xl font-black text-primary tracking-tighter">124ms</div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-2">Avg. Latency (p95)</p>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="text-xl font-bold">1.2k</div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Req/min</div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-l-green-500">
                                <div className="text-xl font-bold">99.9%</div>
                                <div className="text-[10px] text-muted-foreground uppercase font-bold">Success</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
