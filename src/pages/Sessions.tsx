import { useAuth } from '@/auth/useAuth';
import { EmptyState, LoadingState, PageHeader, StatusBadge } from '@/components/common';
import SessionReviewModal from '@/components/SessionReviewModal';
import { Button } from '@/components/ui/button';
import { calculateDuration, formatCurrency, formatDate } from '@/utils/helpers';
import { Calendar, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';

interface Session {
    id: string;
    psychologistId: string;
    patientId: string | null;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
    price: number;
    psychologist: { alias: string };
    patient: { alias: string } | null;
    reviews?: any[];
    title?: string;
    participants?: any[];
}

const Sessions = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [sessionType, setSessionType] = useState<'ALL' | 'ONE_ON_ONE' | 'GROUP'>('ALL');
    const [reviewSession, setReviewSession] = useState<Session | null>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const res = await client.get('/sessions');
            setSessions(res.data.data || res.data || []);
        } catch (error) {
            console.error('Failed to load sessions:', error);
            toast.error('Failed to load sessions');
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredSessions = sessions.filter((session) => {
        const statusMatch = filter === 'ALL' || session.status === filter;
        const typeMatch = sessionType === 'ALL' || session.type === sessionType;
        return statusMatch && typeMatch;
    });

    return (
        <div>
            <PageHeader
                title="Sessions Management"
                description="View and manage all therapy sessions"
                icon={
                    <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-textMuted" />
                        <span className="text-textMuted">{filteredSessions.length} sessions</span>
                    </div>
                }
            />

            {/* Type Tabs */}
            <div className="flex gap-4 mb-6 border-b border-border">
                <button
                    onClick={() => setSessionType('ALL')}
                    className={`pb-2 px-4 font-medium transition-colors ${sessionType === 'ALL'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-textMuted hover:text-text'
                        }`}
                >
                    All Sessions
                </button>
                <button
                    onClick={() => setSessionType('ONE_ON_ONE')}
                    className={`pb-2 px-4 font-medium transition-colors ${sessionType === 'ONE_ON_ONE'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-textMuted hover:text-text'
                        }`}
                >
                    Personal
                </button>
                <button
                    onClick={() => setSessionType('GROUP')}
                    className={`pb-2 px-4 font-medium transition-colors ${sessionType === 'GROUP'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-textMuted hover:text-text'
                        }`}
                >
                    Group
                </button>
            </div>

            {/* Status Filters */}
            <div className="mb-6 flex gap-2 flex-wrap">
                {['ALL', 'PENDING', 'SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`rounded-lg px-4 py-2 font-medium transition-colors ${filter === status
                            ? 'bg-primary text-white'
                            : 'bg-surface text-textMuted hover:bg-white/5'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {loading ? (
                <LoadingState message="Loading sessions..." />
            ) : filteredSessions.length === 0 ? (
                <EmptyState message="No sessions found" />
            ) : (
                <div className="rounded-lg border border-border bg-surface overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 text-textMuted">
                            <tr>
                                <th className="p-4 text-left">Session ID</th>
                                <th className="p-4 text-left">Psychologist</th>
                                <th className="p-4 text-left">Session Title</th>
                                <th className="p-4 text-left">Start Time</th>
                                <th className="p-4 text-left">Duration</th>
                                <th className="p-4 text-right">Price</th>
                                <th className="p-4 text-center">Type</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.map((session) => {
                                const duration = calculateDuration(session.startTime, session.endTime);
                                return (
                                    <tr key={session.id} className="border-t border-border hover:bg-white/5">
                                        <td className="p-4 font-mono text-xs text-textMuted">
                                            {session.id.substring(0, 8)}...
                                        </td>
                                        <td className="p-4 text-text font-medium">
                                            {session.psychologist.alias}
                                        </td>
                                        <td className="p-4 text-text">
                                            {session.type === 'GROUP' ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-primary">{session.title || 'Group Session'}</span>
                                                    <span className="text-xs text-textMuted">
                                                        {(session as any).participants?.length || 0} participants
                                                    </span>
                                                </div>
                                            ) : (
                                                session.patient?.alias || <span className="text-textMuted italic">Not booked</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-textMuted">
                                            {formatDate(session.startTime)}
                                        </td>
                                        <td className="p-4 text-textMuted">
                                            {duration} min
                                        </td>
                                        <td className="p-4 text-right text-green-400 font-medium">
                                            {formatCurrency(session.price)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-xs font-medium">{session.type}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <StatusBadge status={session.status} size="sm" />
                                        </td>
                                        <td className="p-4 text-center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/sessions/${session.id}`)}
                                            >
                                                <Eye size={14} />
                                            </Button>
                                            {user?.role === 'PATIENT' && session.status === 'COMPLETED' && !session.reviews?.length && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => setReviewSession(session)}
                                                    className="ml-2"
                                                >
                                                    Rate Session
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Review Modal */}
            {reviewSession && (
                <SessionReviewModal
                    session={reviewSession}
                    open={!!reviewSession}
                    onClose={() => setReviewSession(null)}
                    onSubmit={() => loadSessions()}
                />
            )}
        </div>
    );
};

export default Sessions;
