import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateGroupSessionModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate?: Date;
}

const CreateGroupSessionModal = ({ open, onClose, onSuccess, selectedDate }: CreateGroupSessionModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        startTime: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
        duration: 60,
        price: 50,
        maxParticipants: 5,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            const start = new Date(formData.startTime);
            const now = new Date();

            // Validate that start time is in the future
            if (start <= now) {
                toast.error('Start time must be in the future');
                setLoading(false);
                return;
            }

            const end = new Date(start.getTime() + formData.duration * 60000);

            console.log('Creating group session:', {
                title: formData.title,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                localStart: start.toString(),
                localEnd: end.toString(),
            });

            await client.post('/sessions', {
                title: formData.title,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                price: Number(formData.price),
                maxParticipants: Number(formData.maxParticipants),
                type: 'GROUP',
            });

            toast.success('Group session created successfully');
            onSuccess();
            onClose();
            
            // Reset form
            setFormData({
                title: '',
                startTime: '',
                duration: 60,
                price: 50,
                maxParticipants: 5,
            });
        } catch (error: any) {
            console.error('Failed to create session:', error);
            const message = error.response?.data?.message || 'Failed to create session';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Group Session</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Session Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Anxiety Support Group"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start">Start Time</Label>
                            <Input
                                id="start"
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (mins)</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="15"
                                step="15"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price ($)</Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxParticipants">Max Participants</Label>
                            <Input
                                id="maxParticipants"
                                type="number"
                                min="2"
                                max="50"
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Session'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateGroupSessionModal;
