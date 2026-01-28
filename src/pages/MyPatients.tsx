import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Ban, Search, Shield, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const MyPatients = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [blockedPatients, setBlockedPatients] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sessionsRes, blockedRes] = await Promise.all([
                client.get('/sessions'),
                client.get('/blocked-patients')
            ]);

            const data = sessionsRes.data.data || sessionsRes.data;
            const mySessions = Array.isArray(data)
                ? data.filter((s: any) => s.psychologistId === user?.id)
                : [];
            setSessions(mySessions);

            // Get blocked patient IDs
            const blockedData = blockedRes.data.data || blockedRes.data || [];
            const blockedIds = new Set<string>(blockedData.map((b: any) => String(b.patientId)));
            setBlockedPatients(blockedIds);

            // Build patient list with stats
            const patientMap = new Map();
            mySessions.forEach((session: any) => {
                if (!session.patient || !session.patientId) return;

                if (!patientMap.has(session.patientId)) {
                    patientMap.set(session.patientId, {
                        ...session.patient,
                        sessionCount: 0,
                        completedCount: 0,
                        totalSpent: 0,
                        lastSession: null,
                        sessions: [],
                    });
                }

                const patient = patientMap.get(session.patientId);
                patient.sessionCount++;
                patient.sessions.push(session);
                if (session.status === 'COMPLETED') {
                    patient.completedCount++;
                    patient.totalSpent += session.price || 0;
                }
                if (!patient.lastSession || new Date(session.startTime) > new Date(patient.lastSession)) {
                    patient.lastSession = session.startTime;
                }
            });

            setPatients(Array.from(patientMap.values()));
        } catch (error) {
            console.error('Failed to load patients:', error);
            toast.error('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.alias?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleBlockPatient = async (patientId: string, alias: string) => {
        try {
            await client.post(`/blocked-patients/${patientId}`, {
                reason: 'Blocked from psychologist dashboard'
            });
            setBlockedPatients(new Set([...blockedPatients, patientId]));
            toast.success(`${alias} has been blocked`);
        } catch (error) {
            console.error('Failed to block patient:', error);
            toast.error('Failed to block patient');
        }
    };

    const handleUnblockPatient = async (patientId: string, alias: string) => {
        try {
            await client.delete(`/blocked-patients/${patientId}`);
            const newBlocked = new Set(blockedPatients);
            newBlocked.delete(patientId);
            setBlockedPatients(newBlocked);
            toast.success(`${alias} has been unblocked`);
        } catch (error) {
            console.error('Failed to unblock patient:', error);
            toast.error('Failed to unblock patient');
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading patients...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text">My Patients</h1>
                <p className="text-textMuted mt-1">View and manage your patient relationships</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Patients" value={patients.length} />
                <StatCard label="Total Sessions" value={sessions.length} />
                <StatCard
                    label="Active This Month"
                    value={patients.filter(p => {
                        if (!p.lastSession) return false;
                        const lastSession = new Date(p.lastSession);
                        const now = new Date();
                        return lastSession.getMonth() === now.getMonth() &&
                            lastSession.getFullYear() === now.getFullYear();
                    }).length}
                />
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={18} />
                <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-text"
                />
            </div>

            {/* Patients List */}
            {filteredPatients.length === 0 ? (
                <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                    <Users className="mx-auto mb-4 text-textMuted opacity-50" size={48} />
                    <h3 className="text-lg font-semibold text-text mb-2">
                        {searchTerm ? 'No patients found' : 'No patients yet'}
                    </h3>
                    <p className="text-textMuted">
                        {searchTerm ? 'Try a different search term' : 'Patients will appear here after their first session'}
                    </p>
                </div>
            ) : (
                <div className="bg-surface rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background border-b border-border">
                                <tr>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Patient</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Sessions</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Completed</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Total Spent</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Last Session</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="border-b border-border hover:bg-background transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {patient.alias?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-text">{patient.alias}</p>
                                                    <p className="text-xs text-textMuted">{patient.email || 'No email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-text">{patient.sessionCount}</td>
                                        <td className="p-4">
                                            <span className="text-green-600 font-semibold">{patient.completedCount}</span>
                                        </td>
                                        <td className="p-4 text-text font-semibold">${patient.totalSpent.toFixed(2)}</td>
                                        <td className="p-4 text-textMuted text-sm">
                                            {patient.lastSession
                                                ? new Date(patient.lastSession).toLocaleDateString()
                                                : 'Never'}
                                        </td>
                                        <td className="p-4">
                                            {blockedPatients.has(patient.id) ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUnblockPatient(patient.id, patient.alias)}
                                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                                >
                                                    <Shield size={16} className="mr-2" />
                                                    Unblock
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleBlockPatient(patient.id, patient.alias)}
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                >
                                                    <Ban size={16} className="mr-2" />
                                                    Block
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div className="bg-surface p-6 rounded-xl border border-border">
        <p className="text-textMuted text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold text-text">{value}</p>
    </div>
);

export default MyPatients;
