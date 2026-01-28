import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Testimonials = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReviews();
    }, []);

    const loadReviews = async () => {
        try {
            // Fetch reviews from the dedicated endpoint
            const response = await client.get('/profile/reviews');
            const reviewsData = response.data.data || response.data || [];
            setReviews(reviewsData);
        } catch (error) {
            console.error('Failed to load reviews:', error);
            toast.error('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = async (reviewId: string) => {
        try {
            await client.patch(`/profile/reviews/${reviewId}/toggle-visibility`);
            
            // Update local state by toggling the isHidden flag
            setReviews(reviews.map(r => 
                r.id === reviewId ? { ...r, isHidden: !r.isHidden } : r
            ));
            
            // Show appropriate message based on new state
            const review = reviews.find(r => r.id === reviewId);
            if (review) {
                toast.success(review.isHidden ? 'Review is now visible' : 'Review hidden from profile');
            }
        } catch (error) {
            console.error('Failed to toggle visibility:', error);
            toast.error('Failed to update visibility');
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading testimonials...</div>;

    const visibleReviews = reviews.filter(r => !r.isHidden);
    const hiddenReviews = reviews.filter(r => r.isHidden);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text">Patient Testimonials</h1>
                <p className="text-textMuted mt-1">Reviews from patients who have completed sessions with you</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Reviews" value={reviews.length} />
                <StatCard label="Visible" value={visibleReviews.length} />
                <StatCard label="Hidden" value={hiddenReviews.length} />
                <StatCard 
                    label="Average Rating" 
                    value={reviews.length > 0 
                        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                        : '0.0'
                    }
                />
            </div>

            {/* Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="text-sm text-blue-600">
                    <strong>Note:</strong> Testimonials are written by patients after sessions. You can hide reviews from your public profile but cannot edit or delete them to maintain authenticity.
                </p>
            </div>

            {/* Visible Reviews */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-text">Visible on Your Profile</h2>
                {visibleReviews.length === 0 ? (
                    <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                        <p className="text-textMuted">No visible reviews yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleReviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                onToggleVisibility={toggleVisibility}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Hidden Reviews */}
            {hiddenReviews.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-text">Hidden from Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hiddenReviews.map((review) => (
                            <ReviewCard
                                key={review.id}
                                review={review}
                                onToggleVisibility={toggleVisibility}
                            />
                        ))}
                    </div>
                </div>
            )}

            {reviews.length === 0 && (
                <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                    <Star className="mx-auto mb-4 text-textMuted opacity-50" size={48} />
                    <h3 className="text-lg font-semibold text-text mb-2">No Reviews Yet</h3>
                    <p className="text-textMuted">Complete more sessions to receive patient testimonials</p>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-surface p-6 rounded-xl border border-border">
        <p className="text-textMuted text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-text mt-1">{value}</p>
    </div>
);

const ReviewCard = ({ review, onToggleVisibility }: any) => (
    <div className={`bg-surface rounded-xl border p-6 ${review.isHidden ? 'opacity-60 border-dashed' : 'border-border'}`}>
        <div className="flex items-start justify-between mb-3">
            <div>
                <p className="font-semibold text-text">{review.patient?.alias || 'Anonymous Patient'}</p>
                <div className="flex gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                        />
                    ))}
                </div>
            </div>
            <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleVisibility(review.id)}
                title={review.isHidden ? 'Show on profile' : 'Hide from profile'}
            >
                {review.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </Button>
        </div>
        <p className="text-sm text-textMuted mb-2">{review.comment}</p>
        <div className="text-xs text-textMuted">
            Session: {new Date(review.session?.startTime).toLocaleDateString()}
        </div>
    </div>
);

export default Testimonials;
