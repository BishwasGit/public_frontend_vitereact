import { PageHeader } from '@/components/common';
import PasswordChangeModal from '@/components/PasswordChangeModal';
import { Button } from '@/components/ui/button';
import { Bell, Lock, Settings as SettingsIcon, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import client from '../api/client';
import { useAuth } from '../auth/useAuth';

const Settings = () => {
    const { user } = useAuth();
    // Profile state removed - moved to separate page
    const [notificationParams, setNotificationParams] = useState({
        email: true,
        push: true,
        payment: true,
    });
    const [preferences, setPreferences] = useState({
        theme: 'light',
        sessionTimeout: '30',
    });
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);

    useEffect(() => {
        // Load settings if needed
        if (user) {
           loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            const res = await client.get('/profile'); // Still getting prefs from same endpoint for now
            if (res.data.notificationPreferences) {
                setNotificationParams(res.data.notificationPreferences);
            }
            setPreferences({
                theme: res.data.theme || 'light',
                sessionTimeout: res.data.sessionTimeout?.toString() || '30',
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    };

    const handleSave = async () => {
        try {
            await client.patch('/profile', {
                // Only sending preferences
                notificationPreferences: {
                    email: notificationParams.email,
                    push: notificationParams.push,
                    payment: notificationParams.payment,
                },
                theme: preferences.theme,
                sessionTimeout: parseInt(preferences.sessionTimeout),
            });
            toast.success('Settings updated successfully!');
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error('Failed to update settings');
        }
    };

    return (
        <div>
            <PageHeader
                title="Settings"
                description="Manage your account preferences"
                icon={<SettingsIcon size={24} className="text-primary" />}
            />

            <div className="space-y-6">
                {/* Profile Settings moved to /profile page */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <User className="text-blue-600" size={24} />
                        <div>
                            <h3 className="font-semibold text-blue-900">Profile Information</h3>
                            <p className="text-sm text-blue-700">Manage your personal details on the Profile page.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => window.location.href='/profile'}>
                        Go to Profile
                    </Button>
                </div>

                <div className="rounded-lg border border-border bg-surface p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Bell className="text-primary" size={24} />
                        <h3 className="text-lg font-semibold text-text">Notifications</h3>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-text">Email Notifications</span>
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 cursor-pointer" 
                                checked={notificationParams.email}
                                onChange={(e) => setNotificationParams({...notificationParams, email: e.target.checked})}
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-text">Push Notifications</span>
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 cursor-pointer" 
                                checked={notificationParams.push}
                                onChange={(e) => setNotificationParams({...notificationParams, push: e.target.checked})}
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-text">Payment Updates</span>
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 cursor-pointer" 
                                checked={notificationParams.payment}
                                onChange={(e) => setNotificationParams({...notificationParams, payment: e.target.checked})}
                            />
                        </label>
                    </div>
                </div>

                {/* Privacy & Security */}
                <div className="rounded-lg border border-border bg-surface p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Lock className="text-primary" size={24} />
                        <h3 className="text-lg font-semibold text-text">Privacy & Security</h3>
                    </div>
                    <div className="space-y-3">
                        <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setPasswordModalOpen(true)}
                        >
                            Change Password
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => toast.info('Two-factor authentication coming soon!')}
                        >
                            Two-Factor Authentication
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full justify-start text-red-400"
                            onClick={() => toast.warning('Account deletion requires admin approval')}
                        >
                            Delete Account
                        </Button>
                    </div>
                </div>

                {/* Preferences */}
                <div className="rounded-lg border border-border bg-surface p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <SettingsIcon className="text-primary" size={24} />
                        <h3 className="text-lg font-semibold text-text">Preferences</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-text block mb-2">Theme</label>
                            <select 
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                value={preferences.theme}
                                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="system">System</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text block mb-2">Session Timeout (Minutes)</label>
                            <select 
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                value={preferences.sessionTimeout}
                                onChange={(e) => setPreferences({ ...preferences, sessionTimeout: e.target.value })}
                            >
                                <option value="15">15 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="60">1 Hour</option>
                                <option value="120">2 Hours</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <PasswordChangeModal 
                open={passwordModalOpen} 
                onClose={() => setPasswordModalOpen(false)} 
            />
        </div>
    );
};

export default Settings;
