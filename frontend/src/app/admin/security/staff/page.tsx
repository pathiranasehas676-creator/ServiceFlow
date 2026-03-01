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
    DialogFooter
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Loader2,
    ShieldAlert,
    UserCog,
    Mail,
    History,
    Search,
    Filter,
    Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

interface StaffUser {
    id: string;
    email: string;
    fullName: string;
    role: string;
    lastLoginAt?: string;
    isActive: boolean;
}

export default function StaffManagementPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    // Fetch all users with administrative roles (ADMIN, STAFF, SUPER_ADMIN)
    const { data: staff, isLoading } = useQuery<StaffUser[]>({
        queryKey: ['admin', 'users', 'staff'],
        queryFn: () => api.get('/users?roles=ADMIN,STAFF'),
    });

    const { data: roles } = useQuery<string[]>({
        queryKey: ['admin', 'rbac', 'roles'],
        queryFn: () => api.get('/admin/rbac/roles'),
    });

    const updateRoleMutation = useMutation({
        mutationFn: (data: { userId: string, role: string }) =>
            api.patch(`/users/${data.userId}/role`, { role: data.role }),
        onSuccess: () => {
            toast.success('User role updated successfully');
            setIsRoleDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'staff'] });
        },
        onError: () => {
            toast.error('Failed to update user role');
        }
    });

    const filteredStaff = staff?.filter(u =>
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search staff by name or email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                    <Button className="gap-2">
                        <UserCog className="h-4 w-4" />
                        Invite Staff
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                    <CardTitle>Staff Directory</CardTitle>
                    <CardDescription>Manage administrative users and holographic identity roles.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="pl-6">User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Current Role</TableHead>
                                <TableHead>Last Active</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="pl-6 flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredStaff?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
                                            <p className="text-muted-foreground">No staff members found matching your search.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStaff?.map((user) => (
                                    <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner ring-2 ring-background bg-indigo-600 ring-indigo-100"
                                                )}>
                                                    {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="font-semibold">{user.fullName}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-muted-foreground text-sm">
                                                <Mail className="mr-2 h-3 w-3" />
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "font-bold px-2 py-0.5 tracking-tighter uppercase text-[10px]",
                                                    user.role === 'STAFF' && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                                                    user.role === 'ADMIN' && "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                                )}
                                            >
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-muted-foreground text-xs font-medium">
                                                <Clock className="mr-2 h-3 w-3" />
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" title="Activity History">
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={user.id === currentUser?.id}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsRoleDialogOpen(true);
                                                    }}
                                                    title="Modify Role"
                                                >
                                                    <UserCog className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Role Modification Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent className="max-w-md bg-card/95 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-amber-500" />
                            Modify System Role
                        </DialogTitle>
                        <DialogDescription>
                            Change the operational scope for <strong>{selectedUser?.fullName}</strong>. This takes effect immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Select New Role</label>
                            <Select
                                value={selectedUser?.role}
                                onValueChange={(val) => {
                                    if (selectedUser) setSelectedUser({ ...selectedUser, role: val });
                                }}
                            >
                                <SelectTrigger className="h-12 rounded-xl">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles?.filter(r => r !== 'USER' && r !== 'WORKER').map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-[11px] text-muted-foreground bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                            <strong>Note:</strong> Downgrading an ADMIN to STAFF will revoke their access to finance and system settings. Upgrading will grant full operational visibility.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                        <Button
                            className="px-8 shadow-lg shadow-primary/20 rounded-xl"
                            onClick={() => selectedUser && updateRoleMutation.mutate({ userId: selectedUser.id, role: selectedUser.role })}
                            disabled={updateRoleMutation.isPending}
                        >
                            {updateRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Apply Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
