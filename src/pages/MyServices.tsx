import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Edit, Package, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const MyServices = () => {
    // const { user } = useAuth(); // Removed unused user
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration: '',
        type: 'VIDEO',
        billingType: 'PER_SESSION',
        isEnabled: true,
    });

    useEffect(() => {
        loadServices();
    }, []);

    const loadServices = async () => {
        try {
            const res = await client.get('/service-options/my');
            const data = res.data.data || res.data;
            setServices(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Failed to load services:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to load services';
            toast.error(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                duration: formData.duration ? parseInt(formData.duration) : null,
            };

            if (editingService) {
                await client.patch(`/service-options/${editingService.id}`, payload);
                toast.success('Service updated successfully');
            } else {
                await client.post('/service-options', payload);
                toast.success('Service created successfully');
            }

            setOpen(false);
            resetForm();
            loadServices();
        } catch (error) {
            console.error('Failed to save service:', error);
            toast.error('Failed to save service');
        }
    };

    const handleEdit = (service: any) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            description: service.description || '',
            price: service.price.toString(),
            duration: service.duration?.toString() || '',
            type: service.type,
            billingType: service.billingType,
            isEnabled: service.isEnabled,
        });
        setOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;
        try {
            await client.delete(`/service-options/${id}`);
            toast.success('Service deleted');
            loadServices();
        } catch (error) {
            console.error('Failed to delete service:', error);
            toast.error('Failed to delete service');
        }
    };

    const toggleEnabled = async (service: any) => {
        try {
            await client.patch(`/service-options/${service.id}`, {
                isEnabled: !service.isEnabled,
            });
            toast.success(`Service ${!service.isEnabled ? 'enabled' : 'disabled'}`);
            loadServices();
        } catch (error) {
            console.error('Failed to toggle service:', error);
            toast.error('Failed to update service');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            duration: '',
            type: 'VIDEO',
            billingType: 'PER_SESSION',
            isEnabled: true,
        });
        setEditingService(null);
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading services...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">My Services & Packages</h1>
                    <p className="text-textMuted mt-1">Manage your service offerings and pricing</p>
                </div>
                <Dialog open={open} onOpenChange={(isOpen) => {
                    setOpen(isOpen);
                    if (!isOpen) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus size={16} className="mr-2" />
                            Add Service
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>Service Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Standard Session"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Description</Label>
                                    <textarea
                                        className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe this service package..."
                                    />
                                </div>
                                <div>
                                    <Label>Price ($) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="50.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Duration (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="60"
                                    />
                                </div>
                                <div>
                                    <Label>Service Type *</Label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="VIDEO">Video Call</option>
                                        <option value="AUDIO_ONLY">Audio Only</option>
                                        <option value="CHAT">Chat/Messaging</option>
                                        <option value="GROUP">Group Session</option>
                                    </select>
                                </div>
                                <div>
                                    <Label>Billing Type *</Label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={formData.billingType}
                                        onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                                    >
                                        <option value="PER_SESSION">Per Session</option>
                                        <option value="PER_MINUTE">Per Minute</option>
                                        <option value="BUNDLE_7_DAY">7-Day Bundle</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isEnabled"
                                    checked={formData.isEnabled}
                                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="isEnabled">Enable this service for patients to book</Label>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => {
                                    setOpen(false);
                                    resetForm();
                                }}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingService ? 'Update' : 'Create'} Service
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Services Grid */}
            {services.length === 0 ? (
                <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                    <Package className="mx-auto mb-4 text-textMuted opacity-50" size={48} />
                    <h3 className="text-lg font-semibold text-text mb-2">No Services Yet</h3>
                    <p className="text-textMuted mb-4">Create your first service package to start accepting bookings</p>
                    <Button onClick={() => setOpen(true)}>
                        <Plus size={16} className="mr-2" />
                        Add Your First Service
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className={`bg-surface rounded-xl border p-6 ${service.isEnabled ? 'border-border' : 'border-border opacity-60'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold text-text">{service.name}</h3>
                                        {!service.isEnabled && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                                                Disabled
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-textMuted">{service.description || 'No description'}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleEdit(service)}
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-400 hover:text-red-500"
                                        onClick={() => handleDelete(service.id)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-background rounded-lg p-3">
                                    <p className="text-xs text-textMuted mb-1">Price</p>
                                    <p className="text-xl font-bold text-primary flex items-center">
                                        <DollarSign size={16} />
                                        {service.price.toFixed(2)}
                                    </p>
                                </div>
                                {service.duration && (
                                    <div className="bg-background rounded-lg p-3">
                                        <p className="text-xs text-textMuted mb-1">Duration</p>
                                        <p className="text-xl font-bold text-text">{service.duration} min</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs">
                                        {service.type}
                                    </span>
                                    <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs">
                                        {service.billingType}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant={service.isEnabled ? 'outline' : 'default'}
                                    onClick={() => toggleEnabled(service)}
                                >
                                    {service.isEnabled ? 'Disable' : 'Enable'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyServices;
