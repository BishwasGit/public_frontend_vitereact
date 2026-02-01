import client from '@/api/client';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PaymentMethods = () => {
    const navigate = useNavigate();
    const [methods, setMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    const [qrFile, setQrFile] = useState<File | null>(null);

    // Form State
    const [type, setType] = useState('BANK');
    const [details, setDetails] = useState<any>({});

    useEffect(() => {
        loadMethods();
    }, []);

    const loadMethods = async () => {
        try {
            const res = await client.get('/payout-methods');
            setMethods(res.data.data || []);
        } catch (error) {
            console.error('Failed to load methods:', error);
            toast.error('Failed to load payment methods');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this payment method?')) return;

        try {
            await client.delete(`/payout-methods/${id}`);
            toast.success('Payment method removed');
            loadMethods();
        } catch (error) {
            console.error('Failed to delete method:', error);
            toast.error('Failed to delete method');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append('type', type);
            formData.append('details', JSON.stringify(details));
            formData.append('isDefault', String(methods.length === 0));

            if (qrFile) {
                formData.append('qrCode', qrFile);
            }

            await client.post('/payout-methods', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            toast.success('Payment method added successfully');
            setOpen(false);
            setDetails({});
            setQrFile(null);
            loadMethods();
        } catch (error) {
            console.error('Failed to add method:', error);
            toast.error('Failed to add payment method');
        } finally {
            setSubmitting(false);
        }
    };

    const renderFormFields = () => {
        switch (type) {
            case 'BANK':
                return (
                    <>
                        <div className="space-y-2">
                            <Label>Bank Name</Label>
                            <Input
                                placeholder="e.g. Nabil Bank"
                                value={details.bankName || ''}
                                onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Name</Label>
                            <Input
                                placeholder="Account Holder Name"
                                value={details.accountName || ''}
                                onChange={(e) => setDetails({ ...details, accountName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Account Number</Label>
                            <Input
                                placeholder="Account Number"
                                value={details.accountNumber || ''}
                                onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Branch</Label>
                            <Input
                                placeholder="Branch Name"
                                value={details.branch || ''}
                                onChange={(e) => setDetails({ ...details, branch: e.target.value })}
                                required
                            />
                        </div>
                    </>
                );
            case 'ESEWA':
            case 'KHALTI':
                return (
                    <>
                        <div className="space-y-2">
                            <Label>{type === 'ESEWA' ? 'eSewa ID' : 'Khalti ID'} (Mobile Number)</Label>
                            <Input
                                placeholder="98XXXXXXXX"
                                value={details.mobileNumber || ''}
                                onChange={(e) => setDetails({ ...details, mobileNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Upload QR Code (Optional)</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setQrFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Button
                variant="ghost"
                onClick={() => navigate('/wallet')}
                className="mb-4 pl-0 hover:pl-2 transition-all"
            >
                <ArrowLeft size={16} className="mr-2" />
                Back to Wallet
            </Button>

            <div className="flex items-center justify-between mb-6">
                <PageHeader
                    title="Payment Methods"
                    description="Manage your withdrawal destinations"
                    icon={<CreditCard size={24} className="text-primary" />}
                />

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus size={16} className="mr-2" />
                            Add Method
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Payment Method</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Method Type</Label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={type}
                                    onChange={(e) => {
                                        setType(e.target.value);
                                        setDetails({});
                                    }}
                                >
                                    <option value="BANK">Bank Transfer</option>
                                    <option value="ESEWA">eSewa Wallet</option>
                                    <option value="KHALTI">Khalti Wallet</option>
                                </select>
                            </div>

                            {renderFormFields()}

                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? 'Saving...' : 'Save Method'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center p-12 text-textMuted">Loading...</div>
            ) : methods.length === 0 ? (
                <div className="text-center p-12 border border-dashed border-border rounded-lg">
                    <p className="text-textMuted mb-4">No payment methods added yet</p>
                    <Button variant="outline" onClick={() => setOpen(true)}>Add your first method</Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {methods.map((method) => (
                        <div key={method.id} className="relative p-6 rounded-lg border border-border bg-surface hover:border-primary/50 transition-colors group">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center
                                        ${method.type === 'BANK' ? 'bg-blue-500/10 text-blue-500' :
                                            method.type === 'ESEWA' ? 'bg-green-500/10 text-green-500' :
                                                'bg-purple-500/10 text-purple-500'}`}>
                                        <CreditCard size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{method.type}</h3>
                                        <p className="text-sm text-textMuted">
                                            {method.type === 'BANK' ? `${method.details.bankName} - ${method.details.accountNumber}` : method.details.mobileNumber}
                                        </p>
                                        {method.isDefault && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                    onClick={(e) => handleDelete(method.id, e)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PaymentMethods;
