import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Link as LinkIcon, MapPin, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface EventDetailsModalProps {
    open: boolean;
    onClose: () => void;
    event: any;
}

const EventDetailsModal = ({ open, onClose, event }: EventDetailsModalProps) => {
    if (!event) return null;

    const resource = event.resource;
    const isSession = resource.isSession;

    const handleCopyLink = () => {
        if (resource.meetingLink) {
            navigator.clipboard.writeText(resource.meetingLink);
            toast.success('Meeting link copied to clipboard');
        }
    };

    const handleShare = () => {
        // Mock sharing functionality for now
        const shareText = `Event: ${event.title}\nTime: ${new Date(event.start).toLocaleString()} - ${new Date(event.end).toLocaleString()}`;
        navigator.clipboard.writeText(shareText);
        toast.success('Event details copied to clipboard');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {event.title}
                        {isSession && (
                            <Badge variant={
                                resource.status === 'COMPLETED' ? 'success' :
                                resource.status === 'CANCELLED' ? 'destructive' :
                                resource.status === 'LIVE' ? 'warning' : 'default'
                            }>
                                {resource.status}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Time */}
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                            <p className="font-medium">Time</p>
                            <p className="text-sm text-gray-600">
                                {new Date(event.start).toLocaleString()} - 
                                {new Date(event.end).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>

                    {/* Description */}
                    {resource.description && (
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                                <p className="font-medium">Description</p>
                                <p className="text-sm text-gray-600">{resource.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Location / Link */}
                    {(resource.location || resource.meetingLink) && (
                        <div className="flex items-start gap-3">
                            {resource.meetingLink ? (
                                <LinkIcon className="w-5 h-5 text-gray-400 mt-1" />
                            ) : (
                                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                            )}
                            <div>
                                <p className="font-medium">Location</p>
                                {resource.meetingLink ? (
                                    <button 
                                        onClick={handleCopyLink}
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {resource.meetingLink}
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-600">{resource.location}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Type specific details */}
                    {!isSession && resource.type && (
                         <div className="flex items-start gap-3">
                            <div className="w-5 h-5" /> {/* Spacer */}
                            <div>
                                <p className="font-medium">Type</p>
                                <Badge variant="outline">{resource.type}</Badge>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EventDetailsModal;
