import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface PasswordChangeModalProps {
    open: boolean;
    onClose: () => void;
}

const PasswordChangeModal = ({ open, onClose }: PasswordChangeModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPin: '',
        newPin: '',
        confirmPin: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.newPin !== formData.confirmPin) {
            toast.error('New passwords do not match');
            return;
        }

        if (formData.newPin.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await client.post('/auth/change-password', {
                currentPin: formData.currentPin,
                newPin: formData.newPin,
            });
            toast.success('Password changed successfully');
            onClose();
            setFormData({ currentPin: '', newPin: '', confirmPin: '' });
        } catch (error: any) {
            console.error('Failed to change password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input
                            id="current"
                            type="password"
                            value={formData.currentPin}
                            onChange={(e) => setFormData({ ...formData, currentPin: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new">New Password</Label>
                        <Input
                            id="new"
                            type="password"
                            value={formData.newPin}
                            onChange={(e) => setFormData({ ...formData, newPin: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={formData.confirmPin}
                            onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Changing...' : 'Change Password'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PasswordChangeModal;
