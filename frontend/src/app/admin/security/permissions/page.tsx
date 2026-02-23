'use client';

import { useState } from 'react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    Loader2,
    ShieldCheck,
    Plus,
    Search,
    BookOpen,
    Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
    id: string;
    code: string;
    name: string;
    group: string;
    description?: string;
}

export default function PermissionsCatalogPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newPermission, setNewPermission] = useState({
        code: '',
        name: '',
        group: '',
        description: ''
    });
    const queryClient = useQueryClient();

    const { data: permissions, isLoading } = useQuery<Permission[]>({
        queryKey: ['admin', 'rbac', 'permissions'],
        queryFn: () => api.get('/admin/rbac/permissions'),
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof newPermission) => api.post('/admin/rbac/permissions', data),
        onSuccess: () => {
            toast.success('Permission created successfully');
            setIsAddDialogOpen(false);
            setNewPermission({ code: '', name: '', group: '', description: '' });
            queryClient.invalidateQueries({ queryKey: ['admin', 'rbac', 'permissions'] });
        },
        onError: () => {
            toast.error('Failed to create permission. Ensure code is unique.');
        }
    });

    const filteredPermissions = permissions?.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.group.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedCount = permissions?.reduce((acc, p) => {
        acc[p.group] = (acc[p.group] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search codes or names..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" />
                            Define Permission
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>New Permission Definition</DialogTitle>
                            <DialogDescription>
                                Add a new fine-grained permission to the system registry.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Functional Group</label>
                                <Input
                                    placeholder="e.g. FINANCE, JOBS, SYSTEM"
                                    value={newPermission.group}
                                    onChange={(e) => setNewPermission({ ...newPermission, group: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Unique Code</label>
                                    <Input
                                        placeholder="CREATE_JOBS"
                                        value={newPermission.code}
                                        onChange={(e) => setNewPermission({ ...newPermission, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Name</label>
                                    <Input
                                        placeholder="Create Jobs"
                                        value={newPermission.name}
                                        onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Documentation / Description</label>
                                <Textarea
                                    placeholder="Briefly describe what this permission grants access to..."
                                    value={newPermission.description}
                                    onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button
                                onClick={() => createMutation.mutate(newPermission)}
                                disabled={createMutation.isPending || !newPermission.code || !newPermission.group}
                            >
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Register Permission
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {groupedCount && Object.entries(groupedCount).map(([group, count]) => (
                    <Card key={group} className="bg-muted/30 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{group}</p>
                                    <p className="text-2xl font-black">{count}</p>
                                </div>
                                <Tag className="h-8 w-8 text-primary/20" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="border-b bg-muted/20">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Permission Manifest
                    </CardTitle>
                    <CardDescription>Full listing of all available access tokens in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Code & Identity</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="max-w-md">Description</TableHead>
                                <TableHead className="text-right pr-6">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6"><Skeleton className="h-10 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        <TableCell className="text-right pr-6"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPermissions?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <p className="text-muted-foreground">No permissions found matching your search.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPermissions?.map((perm) => (
                                    <TableRow key={perm.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="space-y-1">
                                                <div className="font-mono text-xs font-bold text-primary bg-primary/5 w-fit px-1.5 py-0.5 rounded border border-primary/10">
                                                    {perm.code}
                                                </div>
                                                <div className="text-sm font-semibold">{perm.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-bold tracking-tighter">
                                                {perm.group}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-md text-sm text-muted-foreground line-clamp-2">
                                            {perm.description || 'No detailed documentation available for this token.'}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white font-bold text-[10px]">
                                                ACTIVE
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
