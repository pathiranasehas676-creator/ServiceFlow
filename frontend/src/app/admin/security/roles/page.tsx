'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2, Save, Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
    id: string;
    code: string;
    name: string;
    group: string;
}

interface RolePermission {
    permissionId: string;
    permission: Permission;
}

export default function RolesPage() {
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const { data: roles, isLoading: rolesLoading } = useQuery<string[]>({
        queryKey: ['admin', 'rbac', 'roles'],
        queryFn: () => api.get('/admin/rbac/roles'),
    });

    const { data: permissions, isLoading: permsLoading } = useQuery<Permission[]>({
        queryKey: ['admin', 'rbac', 'permissions'],
        queryFn: () => api.get('/admin/rbac/permissions'),
    });

    const { data: rolePerms, isLoading: rolePermsLoading } = useQuery<RolePermission[]>({
        queryKey: ['admin', 'rbac', 'role-permissions', selectedRole],
        queryFn: () => api.get(`/admin/rbac/role-permissions/${selectedRole}`),
        enabled: !!selectedRole,
    });

    // Sync permissions when rolePerms data arrives
    useEffect(() => {
        if (rolePerms) {
            setSelectedPermissions(rolePerms.map(rp => rp.permission.code));
        }
    }, [rolePerms]);

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
    };

    const updateMutation = useMutation({
        mutationFn: (data: { role: string, permissionCodes: string[] }) =>
            api.post('/admin/rbac/role-permissions', data),
        onSuccess: () => {
            toast.success('Role permissions updated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'role-permissions', selectedRole] });
        },
        onError: () => {
            toast.error('Failed to update role permissions');
        }
    });

    const togglePermission = (code: string) => {
        setSelectedPermissions(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    if (rolesLoading || permsLoading) {
        return <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[600px]" />
        </div>;
    }

    // Sort permissions by group
    const groupedPermissions: Record<string, Permission[]> = (permissions || []).reduce((acc, p) => {
        if (!acc[p.group]) acc[p.group] = [];
        acc[p.group].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            {/* Roles List */}
            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>System Roles</CardTitle>
                    <CardDescription>Select a role to manage baseline permissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {roles?.map((role) => (
                        <Button
                            key={role}
                            variant={selectedRole === role ? 'default' : 'outline'}
                            className={cn(
                                "w-full justify-start gap-2",
                                selectedRole === role && "ring-2 ring-primary ring-offset-2"
                            )}
                            onClick={() => handleRoleSelect(role)}
                        >
                            <Shield className={cn("h-4 w-4", selectedRole === role ? "text-primary-foreground" : "text-primary")} />
                            {role.replace('_', ' ')}
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {/* Permissions Matrix */}
            <Card className="min-h-[600px] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div>
                        <CardTitle>
                            {selectedRole ? `Permissions for ${selectedRole.replace('_', ' ')}` : 'Select a Role'}
                        </CardTitle>
                        <CardDescription>
                            Configure default platform access.
                        </CardDescription>
                    </div>
                    {selectedRole && (
                        <Button
                            onClick={() => updateMutation.mutate({ role: selectedRole, permissionCodes: selectedPermissions })}
                            disabled={updateMutation.isPending || rolePermsLoading}
                            className="shrink-0 shadow-lg"
                        >
                            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Configuration
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                    {!selectedRole ? (
                        <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                            <Lock className="h-16 w-16 text-muted-foreground/20 mb-4" />
                            <p className="text-muted-foreground font-medium">Please select a role from the left to manage permissions.</p>
                        </div>

                    ) : (
                        <div className="divide-y overflow-auto max-h-[700px]">
                            {rolePermsLoading && !rolePerms ? (
                                <div className="p-8 space-y-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="space-y-3">
                                            <Skeleton className="h-4 w-24" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Skeleton className="h-12 w-full" />
                                                <Skeleton className="h-12 w-full" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                Object.entries(groupedPermissions).map(([group, groupPerms]) => (
                                    <div key={group} className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="h-1 w-6 bg-primary/30 rounded-full" />
                                            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">{group}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {groupPerms.map((perm) => {
                                                const isChecked = selectedPermissions.includes(perm.code);
                                                return (
                                                    <div
                                                        key={perm.code}
                                                        className={cn(
                                                            "flex items-center space-x-3 p-4 rounded-xl transition-all border duration-200",
                                                            isChecked
                                                                ? "bg-primary/5 border-primary/20 shadow-sm"
                                                                : "bg-background border-border hover:border-primary/20 hover:bg-muted/30"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            id={`perm-${perm.id}`}
                                                            checked={isChecked}
                                                            onCheckedChange={() => togglePermission(perm.code)}
                                                            className="h-5 w-5 rounded-md"
                                                        />
                                                        <label
                                                            htmlFor={`perm-${perm.id}`}
                                                            className="text-sm font-semibold leading-tight cursor-pointer flex-1"
                                                        >
                                                            {perm.name}
                                                            <span className="block text-[10px] text-muted-foreground mt-1 font-mono">{perm.code}</span>
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
