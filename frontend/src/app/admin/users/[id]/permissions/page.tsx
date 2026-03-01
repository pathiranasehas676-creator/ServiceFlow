'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
    Shield,
    ChevronLeft,
    CheckCircle2,
    Loader2,
    Info,
    AlertCircle,
    Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function StaffPermissionsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [selectedCodes, setSelectedCodes] = React.useState<string[]>([]);

    const { data: allPermissions, isLoading: permsLoading } = useQuery({
        queryKey: ['admin', 'permissions', 'all'],
        queryFn: async () => await api.get('/admin/permissions'),
    });

    const { data: staffData, isLoading: staffLoading } = useQuery({
        queryKey: ['admin', 'users', id],
        queryFn: async () => {
            const users = await api.get('/admin/users');
            return users.find((u: any) => u.id === id);
        },
    });

    const { data: currentPermissions, isLoading: currentLoading } = useQuery({
        queryKey: ['admin', 'staff', id, 'permissions'],
        queryFn: async () => await api.get(`/admin/staff/${id}/permissions`),
    });

    React.useEffect(() => {
        if (currentPermissions) {
            setSelectedCodes(currentPermissions);
        }
    }, [currentPermissions]);

    const mutation = useMutation({
        mutationFn: async (codes: string[]) => {
            return await api.post(`/admin/staff/${id}/permissions`, { permissionCodes: codes });
        },
        onSuccess: () => {
            toast.success('Permissions updated successfully');
            router.push('/admin/users');
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update permissions');
        }
    });

    const togglePermission = (code: string) => {
        setSelectedCodes(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    if (staffLoading || permsLoading || currentLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-muted-foreground animate-pulse">Loading access control data...</p>
            </div>
        );
    }

    if (!staffData || staffData.role !== 'STAFF') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h1 className="text-xl font-bold">Invalid Staff ID</h1>
                <Button asChild variant="outline"><Link href="/admin/users">Back to Users</Link></Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/users"><ChevronLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Staff Permissions</h1>
                    <p className="text-muted-foreground">Manage granular access for <span className="font-bold text-slate-900">{staffData.fullName}</span> ({staffData.email})</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-sm shadow-indigo-100 ring-1 ring-indigo-50 overflow-hidden">
                    <CardHeader className="bg-indigo-600 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Permission Configuration</CardTitle>
                                <CardDescription className="text-indigo-100 italic">Select explicitly granted permissions for this staff member.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allPermissions?.map((perm: any) => (
                                <div
                                    key={perm.id}
                                    className={`
                                        flex items-start space-x-3 space-y-0 rounded-xl border p-4 transition-all duration-200 cursor-pointer
                                        ${selectedCodes.includes(perm.code) ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border-slate-100'}
                                    `}
                                    onClick={() => togglePermission(perm.code)}
                                >
                                    <Checkbox
                                        id={perm.id}
                                        checked={selectedCodes.includes(perm.code)}
                                        className="mt-1 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                    />
                                    <div className="flex flex-col gap-0.5 pointer-events-none">
                                        <label
                                            htmlFor={perm.id}
                                            className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900 uppercase tracking-tight"
                                        >
                                            {perm.code.replace(/_/g, ' ')}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            {perm.label}
                                        </p>
                                    </div>
                                    {selectedCodes.includes(perm.code) && <CheckCircle2 className="h-4 w-4 text-indigo-600 ml-auto animate-in zoom-in" />}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-slate-50 border-t flex items-center justify-between p-6">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Info className="h-4 w-4" />
                            <span>These permissions override standard role defaults for this specific user.</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" asChild><Link href="/admin/users">Cancel</Link></Button>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100"
                                onClick={() => mutation.mutate(selectedCodes)}
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="text-xs text-amber-800 space-y-1">
                        <p className="font-bold">Security Best Practice:</p>
                        <p>Grant only those permissions necessary for the staff member's specific job functions. Changes take effect immediately on next page load or token refresh.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
