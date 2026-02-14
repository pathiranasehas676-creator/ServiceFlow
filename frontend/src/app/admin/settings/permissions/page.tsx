'use client';

import * as React from 'react';
import { Lock, Save, RefreshCw } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ReAuthModal } from '@/components/admin/re-auth-modal';

const ROLES = ['ADMIN', 'STAFF', 'WORKER', 'USER'];

export default function PermissionsPage() {
    const [permissions, setPermissions] = React.useState<any[]>([]);
    const [roleMatrix, setRoleMatrix] = React.useState<Record<string, string[]>>({});
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [reAuthOpen, setReAuthOpen] = React.useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [permsRes, matrixRes] = await Promise.all([
                apiClient.get('/admin/permissions'),
                apiClient.get('/admin/permissions/matrix'),
            ]);
            setPermissions(permsRes.data);
            setRoleMatrix(matrixRes.data);
        } catch (error) {
            toast.error('Failed to load permissions configuration');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const togglePermission = (role: string, permId: string) => {
        setRoleMatrix((prev) => {
            const current = prev[role] || [];
            const updated = current.includes(permId)
                ? current.filter((id) => id !== permId)
                : [...current, permId];
            return { ...prev, [role]: updated };
        });
    };

    const handleSave = () => {
        setReAuthOpen(true);
    };

    const onReAuthSuccess = async (elevatedToken: string) => {
        localStorage.setItem('elevatedToken', elevatedToken);
        setSaving(true);
        try {
            await apiClient.post('/admin/permissions/matrix', roleMatrix);
            toast.success('Permissions updated successfully');
            localStorage.removeItem('elevatedToken'); // Clear after use
        } catch (error) {
            toast.error('Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse flex flex-col items-center">
                <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading permissions matrix...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Access Control</h1>
                    <p className="text-muted-foreground">Configure the fine-grained RBAC matrix for system roles.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchData} size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" /> Reload
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-indigo-600" /> RBAC Matrix
                    </CardTitle>
                    <CardDescription>Lock or unlock system operations for each user role.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-[350px] font-bold text-slate-800 px-6 py-4">Security Permission</TableHead>
                                    {ROLES.map(role => (
                                        <TableHead key={role} className="text-center font-bold text-slate-800">{role}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {permissions.map(perm => (
                                    <TableRow key={perm.id} className="hover:bg-muted/10 transition-colors">
                                        <TableCell className="font-medium px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900">{perm.name.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono uppercase">{perm.id}</span>
                                            </div>
                                        </TableCell>
                                        {ROLES.map(role => (
                                            <TableCell key={`${role}-${perm.id}`} className="text-center">
                                                <div className="flex justify-center">
                                                    <Checkbox
                                                        className="h-5 w-5"
                                                        checked={roleMatrix[role]?.includes(perm.id)}
                                                        onCheckedChange={() => togglePermission(role, perm.id)}
                                                        disabled={role === 'ADMIN'}
                                                    />
                                                </div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <ReAuthModal
                open={reAuthOpen}
                onOpenChange={setReAuthOpen}
                onSuccess={onReAuthSuccess}
            />
        </div>
    );
}
