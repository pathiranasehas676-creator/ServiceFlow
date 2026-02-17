'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Search, RefreshCw } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

interface Service {
    id: string;
    name: string;
    description: string;
    category: string;
    basePriceCents: number;
    isActive: boolean;
    createdAt: string;
}

export default function ServicesPage() {
    const [services, setServices] = React.useState<Service[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingService, setEditingService] = React.useState<Service | null>(null);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await api.get('/admin/services');
            setServices(data || []);
        } catch (error) {
            toast.error('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchServices();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;
        try {
            await api.delete(`/admin/services/${id}`);
            toast.success('Service deleted');
            fetchServices();
        } catch (error) {
            toast.error('Failed to delete service');
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            category: formData.get('category') as string,
            basePriceCents: Number(formData.get('basePriceCents')),
            isActive: formData.get('isActive') === 'on',
        };

        try {
            if (editingService) {
                await api.put(`/admin/services/${editingService.id}`, data);
                toast.success('Service updated');
            } else {
                await api.post('/admin/services', data);
                toast.success('Service created');
            }
            setDialogOpen(false);
            fetchServices();
        } catch (error) {
            toast.error('Failed to save service');
        }
    };

    const openCreate = () => {
        setEditingService(null);
        setDialogOpen(true);
    };

    const openEdit = (service: Service) => {
        setEditingService(service);
        setDialogOpen(true);
    };

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Services Management</h1>
                    <p className="text-muted-foreground">Manage service catalog, pricing, and availability.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchServices}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                                <DialogDescription>Configure service details and pricing.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" defaultValue={editingService?.name} required />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="category">Category</Label>
                                    <Input id="category" name="category" defaultValue={editingService?.category} />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" name="description" defaultValue={editingService?.description} required />
                                </div>
                                <div className="grid w-full gap-1.5">
                                    <Label htmlFor="basePriceCents">Base Price (Cents)</Label>
                                    <Input id="basePriceCents" name="basePriceCents" type="number" defaultValue={editingService?.basePriceCents} required />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch id="isActive" name="isActive" defaultChecked={editingService?.isActive ?? true} />
                                    <Label htmlFor="isActive">Active</Label>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Save Changes</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Service Catalog</CardTitle>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search services..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="pl-6">Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredServices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No services found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredServices.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="pl-6 font-medium">
                                            <div>{service.name}</div>
                                            <div className="text-xs text-muted-foreground">{service.description}</div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{service.category}</Badge></TableCell>
                                        <TableCell>${(service.basePriceCents / 100).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={service.isActive ? 'default' : 'secondary'}>
                                                {service.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(service)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(service.id)}>
                                                    <Trash2 className="h-4 w-4" />
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
        </div>
    );
}
