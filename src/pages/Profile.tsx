import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import StatusSelector from '@/components/StatusSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getMediaUrl } from '@/lib/utils';
import { Camera, Save, Upload, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const Profile = () => {
    const { user } = useAuth();
    const isPsychologist = user?.role === 'PSYCHOLOGIST';
    // Admin only needs minimal info
    const isAdmin = user?.role === 'ADMIN';

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text">Profile Management</h1>
                <p className="text-textMuted mt-1">
                    {isAdmin 
                        ? 'Manage your admin account details.' 
                        : 'Manage your personal and professional information.'}
                </p>
            </div>

            {/* Online Status - Psychologists only, or maybe everyone? Usually just Psychs need to toggle online/offline */}
            {isPsychologist && <StatusSelector />}

            {/* Profile Image - Psychologists only */}
            {isPsychologist && <ProfileImageUpload />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Personal Information */}
                <PersonalInfo userRole={user?.role} />

                {/* 2. Professional Info - Only for Psychologists */}
                {isPsychologist && <ProfessionalInfo />}
            </div>
        </div>
    );
};

// --- Sub Components ---

const ProfileImageUpload = () => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProfileImage();
    }, []);

    const loadProfileImage = async () => {
        try {
            const res = await client.get('/profile');
            const data = res.data.data || res.data;
            if (data.profileImage) {
                setProfileImage(data.profileImage);
            }
        } catch (e) {
            // ignore
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploading(true);
            const res = await client.post('/profile/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfileImage(res.data.data?.profileImage || res.data.profileImage);
            toast.success('Profile image updated successfully');
        } catch (error) {
            console.error('Failed to upload profile image:', error);
            toast.error('Failed to upload profile image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-6 text-primary">
                <Camera size={20} />
                <h2 className="text-xl font-bold text-text">Profile Picture</h2>
            </div>
            <p className="text-sm text-textMuted mb-4">
                This image will be displayed to patients when they search for psychologists.
            </p>

            <div className="flex items-center gap-6">
                {/* Profile Image Preview */}
                <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-background border-2 border-border flex items-center justify-center">
                        {profileImage ? (
                            <img
                                src={getMediaUrl(profileImage)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                }}
                            />
                        ) : (
                            <User size={48} className="text-textMuted" />
                        )}
                    </div>
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        variant="outline"
                    >
                        <Upload size={16} className="mr-2" />
                        {uploading ? 'Uploading...' : profileImage ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    <p className="text-xs text-textMuted mt-2">
                        Recommended: Square image, at least 200x200 pixels. Max 5MB.
                    </p>
                </div>
            </div>
        </div>
    );
};

const PersonalInfo = ({ userRole }: { userRole?: string }) => {
    const isAdmin = userRole === 'ADMIN';
    // Patients and Psychologists have similar personal fields, but Admin is restricted
    
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        alias: '',
        email: '',
        phoneNumber: '',
        bio: '',
        gender: '',
        dateOfBirth: '',
        sexualOrientation: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await client.get('/profile');
            const d = res.data.data || res.data;
            setFormData({
                alias: d.alias || '',
                email: d.email || '',
                phoneNumber: d.phoneNumber || '',
                bio: d.bio || '',
                gender: d.gender || '',
                dateOfBirth: d.dateOfBirth?.split('T')[0] || '',
                sexualOrientation: d.sexualOrientation || '',
            });
        } catch (e) {
            console.error('Failed to load profile:', e);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await client.patch('/profile', { ...formData });
            toast.success('Personal info updated');
            // Reload data to confirm save
            await loadData();
        } catch (e) {
            toast.error('Failed to update personal info');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border p-6 h-fit">
            <div className="flex items-center gap-2 mb-6 text-primary">
                <User size={20} />
                <h2 className="text-xl font-bold text-text">Personal Information</h2>
            </div>
            
            <div className="space-y-4">
                {/* Display Name (All Roles) */}
                <div>
                    <Label>Display Name</Label>
                    <Input 
                        value={formData.alias} 
                        onChange={e => setFormData({...formData, alias: e.target.value})}
                        className="mt-1"
                        placeholder="Your Name"
                    />
                </div>

                {/* Email (All Roles) */}
                <div>
                    <Label>Email</Label>
                    <Input 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="mt-1"
                        type="email"
                    />
                </div>

                {/* Fields for Non-Admins (Patients & Psychologists) */}
                {!isAdmin && (
                    <>
                        {/* Phone */}
                        <div>
                            <Label>Phone Number</Label>
                            <Input 
                                value={formData.phoneNumber} 
                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                className="mt-1"
                                type="tel"
                            />
                        </div>

                        {/* Gender & DOB */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Gender</Label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full px-3 py-2 mt-1 rounded-md border border-input bg-background text-sm"
                                >
                                    <option value="">Select...</option>
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="NON_BINARY">Non-binary</option>
                                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                                </select>
                            </div>
                            <div>
                                <Label>Date of Birth</Label>
                                <Input 
                                    value={formData.dateOfBirth} 
                                    onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                                    className="mt-1"
                                    type="date"
                                />
                            </div>
                        </div>

                         {/* Sexual Orientation (Patients & Psychologists) */}
                         <div>
                            <Label>Sexual Orientation</Label>
                            <select
                                value={formData.sexualOrientation}
                                onChange={(e) => setFormData({ ...formData, sexualOrientation: e.target.value })}
                                className="w-full px-3 py-2 mt-1 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="">Select...</option>
                                <option value="HETEROSEXUAL">Heterosexual</option>
                                <option value="HOMOSEXUAL">Homosexual</option>
                                <option value="BISEXUAL">Bisexual</option>
                                <option value="ASEXUAL">Asexual</option>
                                <option value="OTHER">Other</option>
                                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                            </select>
                        </div>

                        {/* Bio */}
                        <div>
                            <Label>Bio</Label>
                            <textarea
                                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                placeholder="Short bio..."
                            />
                        </div>
                    </>
                )}

                <Button onClick={handleSave} disabled={loading} className="w-full">
                    <Save size={16} className="mr-2" />
                    Save Personal Info
                </Button>
            </div>
        </div>
    );
};

const ProfessionalInfo = () => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        specialties: '',
        languages: '',
        hourlyRate: '',
        isProfileVisible: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await client.get('/profile');
            const data = res.data.data || res.data;
            setFormData({
                specialties: Array.isArray(data.specialties) ? data.specialties.join(', ') : (data.specialties || ''),
                languages: Array.isArray(data.languages) ? data.languages.join(', ') : (data.languages || ''),
                hourlyRate: data.hourlyRate?.toString() || '',
                isProfileVisible: data.isProfileVisible || false,
            });
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await client.patch('/profile', {
                specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
                languages: formData.languages.split(',').map(l => l.trim()).filter(Boolean),
                hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
                isProfileVisible: formData.isProfileVisible,
            });
            toast.success('Professional info updated');
            // Reload data to confirm save
            await loadData();
        } catch (error) {
            toast.error('Failed to update professional info');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface rounded-xl border border-border p-6 h-fit">
            <h2 className="text-xl font-bold text-text mb-6">Professional Details</h2>
            <div className="space-y-4">
                {/* Profile Visibility Toggle */}
                <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                    <div>
                        <p className="font-medium text-text">Profile Visibility</p>
                        <p className="text-sm text-textMuted">Make your profile visible to patients</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isProfileVisible}
                            onChange={(e) => setFormData({ ...formData, isProfileVisible: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div>
                    <Label>Hourly Rate ($)</Label>
                    <Input
                        type="number"
                        value={formData.hourlyRate}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                        placeholder="e.g. 100"
                        className="mt-2"
                    />
                </div>

                <div>
                    <Label>Specialties (comma separated)</Label>
                    <Input
                        value={formData.specialties}
                        onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                        placeholder="e.g. Anxiety, Depression, Trauma"
                        className="mt-2"
                    />
                </div>
                <div>
                    <Label>Languages (comma separated)</Label>
                    <Input
                        value={formData.languages}
                        onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                        placeholder="e.g. English, Spanish"
                        className="mt-2"
                    />
                </div>

                <Button onClick={handleSave} disabled={loading} className="w-full" variant="outline">
                    <Save size={16} className="mr-2" />
                    Save Professional Info
                </Button>
            </div>
        </div>
    );
};

export default Profile;
