import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, Clock, CreditCard, DollarSign, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    billingType?: 'PER_SESSION' | 'PER_MINUTE' | 'BUNDLE_7_DAY';
}

interface Psychologist {
    id: string;
    alias: string;
    hourlyRate?: number;
    pricePerMinute?: number;
    sessionPrice?: number;
    pricingModel?: 'PER_MINUTE' | 'FIXED_SESSION' | 'HOURLY';
    duration?: number;
}

const BookSession = () => {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const serviceId = searchParams.get('serviceId');
    const navigate = useNavigate();
    const { user } = useAuth();

    const [psychologist, setPsychologist] = useState<Psychologist | null>(null);
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [calculatedPrice, setCalculatedPrice] = useState(0);

    const [formData, setFormData] = useState({
        date: '',
        time: '',
        duration: '60',
        notes: '',
    });

    const [wallet, setWallet] = useState({ balance: 0 });
    const [demoInfo, setDemoInfo] = useState<{ remaining: number } | null>(null);

    useEffect(() => {
        if (id) {
            loadData();
            loadDemoInfo();
        }
    }, [id, serviceId]);

    useEffect(() => {
        // Load wallet balance
        const loadWallet = async () => {
            try {
                const response = await client.get('/wallet/balance');
                setWallet(response.data.data);
            } catch (error) {
                console.error('Failed to load wallet:', error);
            }
        };
        if (user) {
            loadWallet();
        }
    }, [user]);

    const loadDemoInfo = async () => {
        try {
            const res = await client.get(`/demo-minutes/psychologist/${id}`);
            const data = res.data.data || res.data;
            setDemoInfo(data);
        } catch (error) {
            console.error('Failed to load demo info:', error);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await client.get(`/profile/psychologists/${id}`);
            const data = response.data.data || response.data;
            setPsychologist(data);

            // Calculate price - handle null/undefined duration
            const duration = data.duration || 60; // Default to 60 minutes if not set
            const durationHours = duration / 60;

            if (data.pricingModel === 'PER_MINUTE') {
                setCalculatedPrice(data.pricePerMinute * duration);
            } else if (data.pricingModel === 'FIXED_SESSION') {
                setCalculatedPrice(data.sessionPrice || 0);
            } else if (data.pricingModel === 'HOURLY') {
                setCalculatedPrice((data.hourlyRate || 0) * durationHours);
            }
        } catch (error) {
            console.error('Failed to load psychologist data:', error);
            toast.error('Failed to load psychologist details');
        } finally {
            setLoading(false);
        }

        // Load service separately if serviceId is provided
        if (serviceId) {
            try {
                const serviceResponse = await client.get(`/service-options/${serviceId}`);
                setService(serviceResponse.data.data || serviceResponse.data);
            } catch (error) {
                console.error('Failed to load service:', error);
                // Don't show error toast for service, it's optional
            }
        }
    };

    const calculatePrice = () => {
        if (service) {
            if (service.billingType === 'PER_MINUTE') {
                return service.price * service.duration;
            }
            return service.price;
        }
        if (psychologist?.hourlyRate) {
            const hours = parseInt(formData.duration) / 60;
            return psychologist.hourlyRate * hours;
        }
        return calculatedPrice;
    };

    // Calculate discounted price for display
    const calculateDiscountedPrice = () => {
        const fullPrice = calculatePrice();
        if (!demoInfo?.remaining || !formData.duration || !psychologist?.hourlyRate) return fullPrice;

        const duration = parseInt(formData.duration);
        const demoApplicable = Math.min(demoInfo.remaining, duration);

        // If fixed price service, difficult to calculate per-minute discount accurately without rate
        // Assuming hourlyRate is the base for calculation if available
        const ratePerMinute = psychologist.hourlyRate / 60;
        const discount = demoApplicable * ratePerMinute;

        return Math.max(0, fullPrice - discount);
    };

    const handleBooking = async () => {
        // Validation
        if (!formData.date || !formData.time) {
            toast.error('Please select date and time');
            return;
        }

        const price = calculatePrice();
        if (wallet.balance < price) {
            toast.error('Insufficient wallet balance. Please add funds first.');
            navigate('/wallet');
            return;
        }

        try {
            setBooking(true);

            // Combine date and time
            const startTime = new Date(`${formData.date}T${formData.time}`);
            const endTime = new Date(startTime.getTime() + parseInt(formData.duration) * 60000);

            await client.post('/sessions/request', {
                psychologistId: id,
                serviceId: service?.id || null,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                price,
                notes: formData.notes,
            });

            toast.success('Session booked successfully!');
            navigate('/sessions');
        } catch (error: any) {
            console.error('Failed to book session:', error);
            toast.error(error.response?.data?.message || 'Failed to book session');
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return <div className="p-10 text-center text-textMuted">Loading...</div>;
    }

    if (!psychologist) {
        return <div className="p-10 text-center text-textMuted">Psychologist not found</div>;
    }

    const price = calculatePrice();
    const discountedPrice = calculateDiscountedPrice();
    const hasDiscount = discountedPrice < price && (demoInfo?.remaining || 0) > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate(`/psychologist/${id}`)}
                className="flex items-center gap-2 text-primary hover:underline"
            >
                <ArrowLeft size={20} />
                Back to Profile
            </button>

            {/* Booking Form */}
            <div className="bg-surface rounded-xl border border-border p-8">
                <h1 className="text-3xl font-bold text-text mb-2">Book a Session</h1>
                <p className="text-textMuted mb-6">Schedule your therapy session with {psychologist.alias}</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Service Selection (if applicable) */}
                        {service && (
                            <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                                <h3 className="font-semibold text-text mb-1">{service.name}</h3>
                                <p className="text-sm text-textMuted mb-2">{service.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {service.duration} minutes
                                    </span>
                                    <span className="flex items-center gap-1 text-green-400 font-semibold">
                                        <DollarSign size={14} />
                                        ${service.price}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Calendar size={16} />
                                    Date
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div>
                                <Label className="flex items-center gap-2 mb-2">
                                    <Clock size={16} />
                                    Time
                                </Label>
                                <Input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Duration (if no service selected) */}
                        {!service && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Duration (minutes)</Label>
                                <Input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    min={psychologist?.duration || 30}
                                    max={180}
                                />
                                <p className="text-sm text-textMuted">
                                    Minimum: {psychologist?.duration || 30} minutes
                                </p>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <Label className="mb-2">Session Notes (Optional)</Label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-text"
                                placeholder="Any specific topics or concerns you'd like to discuss..."
                            />
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-4">
                        {/* Psychologist Info */}
                        <div className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <User size={16} className="text-primary" />
                                <h3 className="font-semibold text-text">Psychologist</h3>
                            </div>
                            <p className="text-textMuted">{psychologist.alias}</p>
                        </div>

                        {/* Price Summary */}
                        <div className="p-4 bg-background rounded-lg border border-border">
                            <h3 className="font-semibold text-text mb-3">Price Summary</h3>
                            <div className="space-y-2 text-sm">
                                {service ? (
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-textMuted block">Service</span>
                                            {service.billingType === 'PER_MINUTE' && (
                                                <span className="text-xs text-textMuted">
                                                    (${service.price}/min × {service.duration}m)
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-text block">
                                                ${service.billingType === 'PER_MINUTE'
                                                    ? (service.price * service.duration).toFixed(2)
                                                    : service.price}
                                            </span>
                                            <span className="text-xs text-textMuted">
                                                {service.billingType === 'PER_MINUTE' ? 'Per Minute' : 'Fixed Price'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-textMuted">Rate per hour</span>
                                            <span className="text-text">${psychologist.hourlyRate || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-textMuted">Duration</span>
                                            <span className="text-text">{formData.duration} min</span>
                                        </div>
                                    </>
                                )}

                                {hasDiscount && (
                                    <div className="flex justify-between text-green-500">
                                        <span className="flex items-center gap-1">
                                            <span>Demo Discount</span>
                                            <span className="text-xs bg-green-500/10 px-1.5 py-0.5 rounded">
                                                -{Math.min(demoInfo?.remaining || 0, parseInt(formData.duration))}m
                                            </span>
                                        </span>
                                        <span>-${(price - discountedPrice).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t border-border pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span className="text-text">Total Estimated</span>
                                        <span className={hasDiscount ? 'text-green-500' : 'text-text'}>
                                            ${discountedPrice.toFixed(2)}
                                        </span>
                                    </div>
                                    {hasDiscount && (
                                        <p className="text-xs text-textMuted mt-1 text-right">
                                            *Full amount (${price.toFixed(2)}) reserved until session ends.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Wallet Balance */}
                        <div className="p-4 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard size={16} className="text-primary" />
                                <h3 className="font-semibold text-text">Wallet Balance</h3>
                            </div>
                            <p className={`text-2xl font-bold ${wallet.balance >= price ? 'text-green-400' : 'text-red-400'}`}>
                                ${wallet.balance.toFixed(2)}
                            </p>
                            {wallet.balance < price && (
                                <p className="text-xs text-red-400 mt-2">Insufficient balance</p>
                            )}
                        </div>

                        {/* Book Button */}
                        <Button
                            onClick={handleBooking}
                            disabled={booking || wallet.balance < price || !formData.date || !formData.time}
                            className="w-full"
                            size="lg"
                        >
                            {booking ? 'Booking...' : `Book Session - $${price.toFixed(2)}`}
                        </Button>

                        {wallet.balance < price && (
                            <Button
                                onClick={() => navigate('/wallet')}
                                variant="outline"
                                className="w-full"
                            >
                                Add Funds to Wallet
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookSession;
