import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Check, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SessionRequest {
    id: string;
    patient: {
        alias: string;
        email?: string;
    };
    startTime: string;
    endTime: string;
    price: number;
    status: string;
}

const SessionRequests = () => {
    const [requests, setRequests] = useState<SessionRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const res = await client.get('/sessions');
            const data = res.data.data || res.data || [];
            // Filter for PENDING sessions where I am the psychologist
            // Ideally backend should have a specific endpoint or filter, but filtering client-side for now based on getAllSessions or getMySessions
            const pending = Array.isArray(data)
                ? data.filter((s: any) => s.status === 'PENDING')
                : [];
            setRequests(pending);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id: string) => {
        try {
            await client.post(`/sessions/${id}/accept`);
            toast.success('Session accepted');
            loadRequests(); // Refresh
        } catch (error) {
            toast.error('Failed to accept session');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await client.post(`/sessions/${id}/reject`);
            toast.success('Session rejected');
            loadRequests(); // Refresh
        } catch (error) {
            toast.error('Failed to reject session');
        }
    };

    if (loading) return <div>Loading requests...</div>;
    if (requests.length === 0) return null; // Hide if no requests

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Clock className="text-orange-500" size={20} />
                <h3 className="font-bold text-text text-lg">Pending Requests</h3>
            </div>
            {requests.map((req) => (
                <div key={req.id} className="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="font-semibold text-text">{req.patient?.alias || 'Patient'}</p>
                        <p className="text-sm text-textMuted">
                            {new Date(req.startTime).toLocaleDateString()} at {new Date(req.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-green-400 mt-1">${req.price}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => handleAccept(req.id)}>
                            <Check size={16} className="mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)}>
                            <X size={16} className="mr-1" /> Reject
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SessionRequests;
