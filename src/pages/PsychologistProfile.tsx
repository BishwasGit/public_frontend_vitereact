import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/utils';
import { ArrowLeft, Award, BookOpen, Calendar, Check, Clock, DollarSign, Globe, Image, Lock, Star, UserCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import client from '../api/client';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    isEnabled: boolean;
    billingType: 'PER_SESSION' | 'PER_MINUTE' | 'BUNDLE_7_DAY';
}

interface Review {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    patient: {
        alias: string;
    };
}

interface Psychologist {
    id: string;
    alias: string;
    bio?: string;
    specialties?: string[];
    languages?: string[];
    education?: string;
    experience?: number;
    isVerified: boolean;
    status?: string;
    hourlyRate?: number;
    services?: Service[];
    profileImage?: string;
    reviews?: Review[];
    averageRating?: number;
    reviewCount?: number;
}

interface GalleryItem {
    id: string;
    filename: string;
    type: string;
    folder: string;
    isLocked: boolean;
    unlockPrice: number;
    isUnlockedByViewer: boolean;
}

const PsychologistProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [psychologist, setPsychologist] = useState<Psychologist | null>(null);
    const [loading, setLoading] = useState(true);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [unlocking, setUnlocking] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadPsychologist();
            loadGallery();
        }
    }, [id]);

    const loadPsychologist = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/profile/psychologists/${id}`);
            const data = res.data.data || res.data;
            setPsychologist(data);
        } catch (error) {
            console.error('Failed to load psychologist profile:', error);
            toast.error('Failed to load psychologist profile');
        } finally {
            setLoading(false);
        }
    };

    const loadGallery = async () => {
        try {
            const viewerId = user?.id || '';
            const res = await client.get(`/media-manager/public-gallery/${id}?viewerId=${viewerId}`);
            const data = res.data.data || res.data || [];
            setGallery(data);
        } catch (error) {
            console.error('Failed to load gallery:', error);
        }
    };

    const handleUnlockImage = async (imageId: string, price: number) => {
        if (!user) {
            toast.error('Please login to unlock images');
            return;
        }

        // Show confirmation with SweetAlert
        const result = await Swal.fire({
            title: '🔓 Unlock This Content?',
            html: `
                <div class="text-left space-y-3">
                    <div class="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                        <span class="text-gray-600">Amount to pay:</span>
                        <span class="text-xl font-bold text-amber-600">$${price.toFixed(2)}</span>
                    </div>
                    <p class="text-sm text-gray-500">
                        This amount will be deducted from your wallet balance.
                    </p>
                    <p class="text-xs text-gray-400">
                        Once unlocked, you can view this content anytime.
                    </p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Pay $${price.toFixed(2)} & Unlock`,
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        setUnlocking(imageId);
        try {
            await client.post(`/media-manager/files/${imageId}/unlock`);
            await Swal.fire({
                title: '🎉 Unlocked!',
                text: 'The content is now available for you.',
                icon: 'success',
                confirmButtonColor: '#10b981',
                timer: 2000,
                timerProgressBar: true
            });
            loadGallery();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Failed to unlock image';
            Swal.fire({
                title: 'Oops!',
                text: message,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setUnlocking(null);
        }
    };

    const handleBookSession = (service?: Service) => {
        // Navigate to booking page with psychologist ID and optional service
        navigate(`/book-session/${id}${service ? `?serviceId=${service.id}` : ''}`);
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'ONLINE': return 'bg-green-500';
            case 'AWAY': return 'bg-yellow-500';
            case 'BUSY': return 'bg-red-500';
            case 'SLEEPING': return 'bg-purple-500';
            case 'OFFLINE': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'ONLINE': return 'Online';
            case 'AWAY': return 'Away';
            case 'BUSY': return 'Busy';
            case 'SLEEPING': return 'Sleeping';
            case 'OFFLINE': return 'Offline';
            default: return 'Offline';
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-textMuted">Loading profile...</div>;
    }

    if (!psychologist) {
        return <div className="p-10 text-center text-textMuted">Psychologist not found</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/find-psychologist')}
                className="flex items-center gap-2 text-primary hover:underline"
            >
                <ArrowLeft size={20} />
                Back to Search
            </button>

            {/* Profile Header */}
            <div className="bg-surface rounded-xl border border-border p-8">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center relative overflow-hidden">
                            {psychologist.profileImage ? (
                                <img
                                    src={getMediaUrl(psychologist.profileImage)}
                                    alt={psychologist.alias}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <UserCircle size={80} className="text-primary" />
                            )}
                            {/* Status Indicator */}
                            <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full ${getStatusColor(psychologist.status)} border-4 border-surface`}></div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-text mb-2">{psychologist.alias}</h1>
                                <div className="flex items-center gap-4 text-sm">
                                    {psychologist.isVerified && (
                                        <div className="flex items-center gap-1 text-green-400">
                                            <Check size={16} />
                                            <span>Verified Professional</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getStatusColor(psychologist.status)}`}></div>
                                        <span className="text-textMuted">{getStatusLabel(psychologist.status)}</span>
                                    </div>
                                </div>
                            </div>
                            {user?.role === 'PATIENT' && (
                                <Button onClick={() => handleBookSession()} size="lg">
                                    <Calendar size={16} className="mr-2" />
                                    Book Session
                                </Button>
                            )}
                        </div>

                        {/* Bio */}
                        {psychologist.bio && (
                            <p className="text-textMuted mb-4">{psychologist.bio}</p>
                        )}

                        {/* Quick Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {psychologist.experience && (
                                <div className="flex items-center gap-2">
                                    <Award className="text-primary" size={20} />
                                    <div>
                                        <p className="text-sm text-textMuted">Experience</p>
                                        <p className="font-semibold text-text">{psychologist.experience} years</p>
                                    </div>
                                </div>
                            )}
                            {psychologist.languages && psychologist.languages.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Globe className="text-primary" size={20} />
                                    <div>
                                        <p className="text-sm text-textMuted">Languages</p>
                                        <p className="font-semibold text-text">{psychologist.languages.join(', ')}</p>
                                    </div>
                                </div>
                            )}
                            {psychologist.hourlyRate && (
                                <div className="flex items-center gap-2">
                                    <DollarSign className="text-primary" size={20} />
                                    <div>
                                        <p className="text-sm text-textMuted">Hourly Rate</p>
                                        <p className="font-semibold text-green-400">${psychologist.hourlyRate}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Specialties */}
            {psychologist.specialties && psychologist.specialties.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-6">
                    <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                        <Star className="text-primary" size={24} />
                        Specialties
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {psychologist.specialties.map((specialty, idx) => (
                            <span
                                key={idx}
                                className="px-4 py-2 rounded-full bg-primary/20 text-primary font-medium text-sm"
                            >
                                {specialty}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {psychologist.education && (
                <div className="bg-surface rounded-xl border border-border p-6">
                    <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                        <BookOpen className="text-primary" size={24} />
                        Education
                    </h2>
                    <p className="text-textMuted">{psychologist.education}</p>
                </div>
            )}

            {/* Services & Packages */}
            {psychologist.services && psychologist.services.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-6">
                    <h2 className="text-xl font-bold text-text mb-4">Services & Packages</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {psychologist.services.filter(s => s.isEnabled).map((service) => (
                            <div
                                key={service.id}
                                className="border border-border rounded-lg p-4 hover:border-primary transition-colors"
                            >
                                <h3 className="font-semibold text-lg text-text mb-2">{service.name}</h3>
                                <p className="text-sm text-textMuted mb-4 line-clamp-2">{service.description}</p>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-textMuted">
                                        <Clock size={16} />
                                        <span className="text-sm">{service.duration} min</span>
                                    </div>
                                    <div className="text-xl font-bold text-green-400">
                                        ${service.price}
                                        <span className="text-sm font-normal text-textMuted ml-1">
                                            {service.billingType === 'PER_MINUTE' ? '/ min' : '/ session'}
                                        </span>
                                    </div>
                                </div>
                                {user?.role === 'PATIENT' && (
                                    <Button
                                        onClick={() => handleBookSession(service)}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        Book This Service
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Gallery Section */}
            {gallery.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-6">
                    <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                        <Image className="text-primary" size={24} />
                        Gallery
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {gallery.map((item) => (
                            <div key={item.id} className="relative overflow-hidden rounded-lg group">
                                <div className="aspect-square bg-background border border-border relative">
                                    {item.type === 'IMAGE' ? (
                                        <img
                                            src={getMediaUrl(item.filename)}
                                            alt={item.folder}
                                            className={`w-full h-full object-cover transition-all ${item.isLocked && !item.isUnlockedByViewer ? 'blur-lg' : ''
                                                }`}
                                        />
                                    ) : (
                                        <video
                                            src={getMediaUrl(item.filename)}
                                            className={`w-full h-full object-cover ${item.isLocked && !item.isUnlockedByViewer ? 'blur-lg' : ''
                                                }`}
                                            controls={!item.isLocked || item.isUnlockedByViewer}
                                        />
                                    )}

                                    {/* Lock Overlay */}
                                    {item.isLocked && !item.isUnlockedByViewer && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                            <Lock className="text-amber-400 mb-2" size={32} />
                                            <p className="text-white text-sm font-semibold mb-2">
                                                ${item.unlockPrice || 0} to unlock
                                            </p>
                                            {user?.role === 'PATIENT' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleUnlockImage(item.id, item.unlockPrice || 0)}
                                                    disabled={unlocking === item.id}
                                                    className="bg-amber-500 hover:bg-amber-600"
                                                >
                                                    {unlocking === item.id ? 'Unlocking...' : 'Unlock Now'}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews/Testimonials Section */}
            {psychologist.reviews && psychologist.reviews.length > 0 && (
                <div className="bg-surface rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-text flex items-center gap-2">
                            <Star className="text-primary" size={24} />
                            Patient Reviews
                        </h2>
                        {psychologist.averageRating !== undefined && psychologist.reviewCount !== undefined && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <Star className="text-yellow-500 fill-yellow-500" size={20} />
                                    <span className="text-2xl font-bold text-text">
                                        {psychologist.averageRating.toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-textMuted text-sm">
                                    ({psychologist.reviewCount} {psychologist.reviewCount === 1 ? 'review' : 'reviews'})
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {psychologist.reviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-background rounded-lg border border-border p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-semibold text-text">{review.patient.alias}</p>
                                        <div className="flex gap-1 mt-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={
                                                        i < review.rating
                                                            ? 'text-yellow-500 fill-yellow-500'
                                                            : 'text-gray-300'
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-xs text-textMuted">
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-textMuted">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PsychologistProfile;
