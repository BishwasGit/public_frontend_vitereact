import { useState, useEffect } from 'react';
import { getSettings, updateCommissionPercent, type SystemSettings } from '../../api/settings';
import { PageHeader } from '@/components/common';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [commissionInput, setCommissionInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await getSettings();
            setSettings(data);
            setCommissionInput(data.commissionPercent.toString());
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const percent = parseFloat(commissionInput);

        if (isNaN(percent) || percent < 0 || percent > 100) {
            toast.error('Commission must be between 0 and 100');
            return;
        }

        try {
            setSaving(true);
            await updateCommissionPercent(percent);
            await fetchSettings();
            toast.success('Commission percentage updated successfully!');
        } catch (error: any) {
            console.error('Failed to update commission:', error);
            toast.error(error.response?.data?.message || 'Failed to update commission');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading settings...</div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="System Settings"
                description="Manage platform-wide configurations"
                icon={<SettingsIcon size={24} className="text-primary" />}
            />

            <div className="space-y-6">
                <div className="rounded-lg border border-border bg-surface p-6">
                    <h2 className="text-xl font-semibold mb-4 text-text">Platform Commission</h2>

                    <div className="mb-6">
                        <label htmlFor="commission" className="block text-sm font-medium text-text mb-2">
                            Commission Percentage (%)
                        </label>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1">
                                <input
                                    id="commission"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={commissionInput}
                                    onChange={(e) => setCommissionInput(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="e.g., 10"
                                />
                                <p className="text-sm text-muted mt-1">
                                    Current platform fee: {settings?.commissionPercent}%
                                </p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                        <h3 className="font-semibold text-sm text-blue-900 mb-2">How it works:</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• When a patient pays for a session, the platform keeps the commission percentage</li>
                            <li>• The psychologist receives the remaining amount (100% - commission)</li>
                            <li>• Example: With {settings?.commissionPercent}% commission on a ₹1000 session:</li>
                            <li className="ml-4">
                                - Platform fee: ₹{((settings?.commissionPercent || 0) * 10).toFixed(2)}
                            </li>
                            <li className="ml-4">
                                - Psychologist receives: ₹{(1000 - (settings?.commissionPercent || 0) * 10).toFixed(2)}
                            </li>
                        </ul>
                    </div>

                    {settings?.updatedAt && (
                        <div className="mt-4 text-xs text-muted">
                            Last updated: {new Date(settings.updatedAt).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
