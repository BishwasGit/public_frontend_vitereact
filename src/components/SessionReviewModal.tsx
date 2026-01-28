import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SessionReviewModalProps {
    session: any;
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

const SessionReviewModal = ({ session, open, onClose, onSubmit }: SessionReviewModalProps) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.error('Please write a review');
            return;
        }

        setSubmitting(true);
        try {
            await client.post(`/sessions/${session.id}/review`, {
                rating,
                comment: comment.trim(),
            });
            toast.success('Thank you for your review!');
            onSubmit();
            onClose();
        } catch (error) {
            console.error('Failed to submit review:', error);
            toast.error('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Rate Your Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                    {/* Psychologist Info */}
                    <div className="bg-surface p-4 rounded-lg border border-border">
                        <p className="text-sm text-textMuted mb-1">Session with</p>
                        <p className="font-semibold text-text">{session.psychologist?.alias || 'Psychologist'}</p>
                        <p className="text-xs text-textMuted mt-1">
                            {new Date(session.startTime).toLocaleDateString()} at{' '}
                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* Rating */}
                    <div>
                        <Label className="mb-3 block">How would you rate this session?</Label>
                        <div className="flex gap-2 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={40}
                                        className={`${
                                            star <= (hoveredRating || rating)
                                                ? 'text-yellow-500 fill-yellow-500'
                                                : 'text-gray-300'
                                        } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-textMuted mt-2">
                            {rating === 5 && 'Excellent!'}
                            {rating === 4 && 'Very Good'}
                            {rating === 3 && 'Good'}
                            {rating === 2 && 'Fair'}
                            {rating === 1 && 'Needs Improvement'}
                        </p>
                    </div>

                    {/* Comment */}
                    <div>
                        <Label className="mb-2 block">Share your experience (required)</Label>
                        <textarea
                            className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What did you like about this session? How did the psychologist help you?"
                            maxLength={500}
                        />
                        <p className="text-xs text-textMuted mt-1 text-right">{comment.length}/500</p>
                    </div>

                    {/* Notice */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                        <p className="text-xs text-blue-600">
                            Your review will be visible on the psychologist's profile and helps other patients make informed decisions.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={onClose} disabled={submitting}>
                            Skip for Now
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SessionReviewModal;
