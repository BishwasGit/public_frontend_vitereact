import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

interface CreateEventModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate?: Date;
}

const CreateEventModal = ({ open, onClose, onSuccess, selectedDate }: CreateEventModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: selectedDate ? selectedDate.toISOString().slice(0, 16) : '',
        endTime: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : '',
        type: 'PERSONAL',
    });

    // Reset form when opening with new selected date
    // Note: In a real app, use useEffect to sync selectedDate to formData

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await client.post('/calendar', {
                title: formData.title,
                description: formData.description,
                startTime: new Date(formData.startTime).toISOString(),
                endTime: new Date(formData.endTime).toISOString(),
                type: formData.type,
            });
            toast.success('Event created successfully');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create event:', error);
            toast.error('Failed to create event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Calendar Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Lunch break"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <select
                            id="type"
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="PERSONAL">Personal</option>
                            <option value="WORK">Work</option>
                            <option value="BLOCKED">Blocked</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start">Start Time</Label>
                            <Input
                                id="start"
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end">End Time</Label>
                            <Input
                                id="end"
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Description</Label>
                        <textarea
                            id="desc"
                            className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Event'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateEventModal;
