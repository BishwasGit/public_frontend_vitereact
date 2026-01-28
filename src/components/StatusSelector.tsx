import client from '@/api/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const StatusSelector = () => {
    const [status, setStatus] = useState('ONLINE');
    const [loading, setLoading] = useState(false);

    const statuses = [
        { value: 'ONLINE', label: 'Online', color: 'bg-green-500', description: 'Available for sessions' },
        { value: 'AWAY', label: 'Away', color: 'bg-yellow-500', description: 'Temporarily unavailable' },
        { value: 'BUSY', label: 'Busy', color: 'bg-red-500', description: 'In a session' },
        { value: 'SLEEPING', label: 'Sleeping', color: 'bg-purple-500', description: 'Off hours' },
        { value: 'OFFLINE', label: 'Offline', color: 'bg-gray-500', description: 'Not accepting sessions' },
    ];

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const res = await client.get('/profile');
            const data = res.data.data || res.data;
            if (data?.status) {
                setStatus(data.status);
            }
        } catch (error) {
            console.error('Failed to load status:', error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            setLoading(true);
            await client.patch('/profile', { status: newStatus });
            setStatus(newStatus);
            toast.success(`Status updated to ${statuses.find(s => s.value === newStatus)?.label}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const currentStatus = statuses.find(s => s.value === status);

    return (
        <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-text">Online Status</h2>
                    <p className="text-sm text-textMuted mt-1">Set your availability status for patients</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${currentStatus?.color} animate-pulse`}></div>
                    <span className="text-lg font-semibold text-text">{currentStatus?.label}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {statuses.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => handleStatusChange(s.value)}
                        disabled={loading || status === s.value}
                        className={`p-4 rounded-lg border-2 transition-all ${status === s.value
                            ? 'border-primary bg-primary/10 scale-105'
                            : 'border-border hover:border-primary/50 hover:bg-white/5'
                            } disabled:opacity-50`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${s.color} ${status === s.value ? 'animate-pulse' : ''}`}></div>
                            <span className="font-semibold text-sm text-text">{s.label}</span>
                        </div>
                        <p className="text-xs text-textMuted text-left">{s.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StatusSelector;
