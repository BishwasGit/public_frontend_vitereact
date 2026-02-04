import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { getStatusColor, getStatusLabel } from '@/utils/helpers';
import { ArrowLeft, Calendar, Check, CheckCircle, Clock, DollarSign, Play, User, Video, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import client from '../api/client';
import { BillingDetails } from '@/components/BillingDetails';

interface SessionDetail {
    id: string;
    psychologistId: string;
    patientId: string | null;
    startTime: string;
    endTime: string;
    status: string;
    type: string;
    price: number;
    createdAt: string;
    psychologist: {
        alias: string;
        bio?: string;
        email?: string;
    };
    patient: {
        alias: string;
        email?: string;
    } | null;
    participants?: {
        id: string;
        alias: string;
    }[];
    title?: string;
}

const SessionView = () => {
    const { user } = useAuth();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Check if current user is the psychologist for this session
    const isPsychologist = user?.role === 'PSYCHOLOGIST' && session?.psychologistId === user?.id;

    // Check if current user is the patient who booked this session OR is a participant
    const isPatient = user?.role === 'PATIENT' && (
        session?.patientId === user?.id ||
        session?.participants?.some(p => p.id === user?.id)
    );

    // Check if session is live (psychologist has started it)
    const isSessionLive = session?.status === 'LIVE';

    // Check if session is pending (needs accept/reject)
    const isPending = session?.status === 'PENDING';

    // Check if session can be started (scheduled and not completed/cancelled)
    // For Group Sessions, psychologist can start it regardless of participants (if time is right)
    const canStartSession = session?.status === 'SCHEDULED' && (session?.patientId || session?.type === 'GROUP');

    // Patient can join if session is LIVE or SCHEDULED (for group sessions where they're a participant)
    const patientCanJoin = isPatient && (
        isSessionLive ||
        (session?.status === 'SCHEDULED' && session?.type === 'GROUP')
    );

    // Debug logging for button visibility
    useEffect(() => {
        if (session && user) {
            console.log('=== BUTTON VISIBILITY DEBUG ===');
            console.log('isPsychologist:', isPsychologist);
            console.log('isPatient:', isPatient);
            console.log('isSessionLive:', isSessionLive);
            console.log('patientCanJoin:', patientCanJoin);
            console.log('Session status:', session.status);
            console.log('Session type:', session.type);
        }
    }, [session, user, isPsychologist, isPatient, isSessionLive, patientCanJoin]);

    useEffect(() => {
        if (sessionId) {
            loadSession();
        }
    }, [sessionId]);

    const loadSession = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/sessions/${sessionId}`);
            const data = res.data.data || res.data;
            setSession(data);

            // Debug logging
            console.log('=== SESSION VIEW DEBUG ===');
            console.log('Session loaded:', data);
            console.log('Current user:', user);
            console.log('User ID:', user?.id);
            console.log('User Role:', user?.role);
            console.log('Session participants:', data.participants);
            console.log('Is user in participants?', data.participants?.some((p: any) => p.id === user?.id));
        } catch (error) {
            console.error('Failed to load session:', error);
            toast.error('Failed to load session details');
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async () => {
        try {
            setActionLoading(true);
            // 1. Update session status to LIVE
            await client.patch(`/sessions/${sessionId}`, { status: 'LIVE' });
            // 2. Set psychologist status to BUSY
            await client.patch('/profile', { status: 'BUSY' });
            // 3. Navigate to video room
            toast.success('Session started!');
            navigate(`/sessions/${sessionId}/room`);
        } catch (error: any) {
            console.error('Failed to start session:', error);
            const message = error?.response?.data?.message || 'Failed to start session';
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinSession = () => {
        // Navigate to the session room for video/audio call
        navigate(`/sessions/${sessionId}/room`);
    };

    const handleCompleteSession = async () => {
        try {
            setActionLoading(true);
            // 1. Mark session as completed
            await client.patch(`/sessions/${sessionId}`, { status: 'COMPLETED' });
            // 2. Set status back to ONLINE
            await client.patch('/profile', { status: 'ONLINE' });
            toast.success('Session completed!');
            navigate('/sessions');
        } catch (error: any) {
            console.error('Failed to complete session:', error);
            const message = error?.response?.data?.message || 'Failed to complete session';
            toast.error(message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptSession = async () => {
        const result = await Swal.fire({
            title: 'Accept Session',
            text: 'Are you sure you want to accept this session booking? The patient will be charged and funds will be transferred to your wallet.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Accept',
            cancelButtonText: 'Cancel',
            background: '#1a1a2e',
            color: '#fff',
        });

        if (result.isConfirmed) {
            try {
                setActionLoading(true);
                await client.post(`/sessions/${sessionId}/accept`);
                toast.success('Session accepted! Funds transferred to your wallet.');
                loadSession(); // Refresh session data
            } catch (error: any) {
                console.error('Failed to accept session:', error);
                const message = error.response?.data?.message || 'Failed to accept session';
                toast.error(message);
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleRejectSession = async () => {
        const result = await Swal.fire({
            title: 'Reject Session',
            text: 'Are you sure you want to reject this session booking? The patient will be refunded.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Reject',
            cancelButtonText: 'Cancel',
            background: '#1a1a2e',
            color: '#fff',
        });

        if (result.isConfirmed) {
            try {
                setActionLoading(true);
                await client.post(`/sessions/${sessionId}/reject`);
                toast.success('Session rejected. Patient has been refunded.');
                loadSession(); // Refresh session data
            } catch (error: any) {
                console.error('Failed to reject session:', error);
                const message = error.response?.data?.message || 'Failed to reject session';
                toast.error(message);
            } finally {
                setActionLoading(false);
            }
        }
    };

    const formatDuration = (start: string, end: string) => {
        const duration = Math.round(
            (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60)
        );
        return `${duration} minutes`;
    };

    return (
        <div>
            {/* Debug Panel - Remove in production */}
            <details style={{ background: '#222', color: '#fff', padding: '1em', borderRadius: 8, marginBottom: 16 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Info</summary>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                    <strong>User:</strong>
                    <pre style={{ background: '#111', color: '#0f0', padding: 8, borderRadius: 4 }}>{JSON.stringify(user, null, 2)}</pre>
                    <strong>Session:</strong>
                    <pre style={{ background: '#111', color: '#0ff', padding: 8, borderRadius: 4 }}>{JSON.stringify(session, null, 2)}</pre>
                    <strong>Computed Values:</strong>
                    <pre style={{ background: '#111', color: '#ff0', padding: 8, borderRadius: 4 }}>
                        {JSON.stringify({
                            isPsychologist,
                            isPatient,
                            isSessionLive,
                            isPending,
                            canStartSession,
                            patientCanJoin,
                            userRole: user?.role,
                            userId: user?.id,
                            sessionType: session?.type,
                            sessionStatus: session?.status,
                            patientId: session?.patientId,
                            participantIds: session?.participants?.map(p => p.id)
                        }, null, 2)}
                    </pre>
                </div>
            </details>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text">Session Details</h2>
                    <p className="text-textMuted mt-1">Complete session information</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/sessions')}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Sessions
                    </Button>

                    {/* Psychologist: Accept/Reject buttons (only when PENDING) */}
                    {isPsychologist && isPending && (
                        <>
                            <Button
                                onClick={handleAcceptSession}
                                disabled={actionLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle size={16} className="mr-2" />
                                Accept
                            </Button>
                            <Button
                                onClick={handleRejectSession}
                                disabled={actionLoading}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <XCircle size={16} className="mr-2" />
                                Reject
                            </Button>
                        </>
                    )}

                    {/* Patient: Waiting message when session is pending */}
                    {isPatient && isPending && (
                        <div className="flex items-center px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                            <Clock size={16} className="mr-2 text-orange-500" />
                            <span className="text-orange-500 text-sm">Waiting for psychologist to accept</span>
                        </div>
                    )}

                    {/* Psychologist: Start Session button (only when SCHEDULED) */}
                    {isPsychologist && canStartSession && (
                        <Button
                            onClick={handleStartSession}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play size={16} className="mr-2" />
                            Start Session
                        </Button>
                    )}

                    {/* Psychologist: Join Session button (when already LIVE) */}
                    {isPsychologist && isSessionLive && (
                        <Button
                            onClick={handleJoinSession}
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Video size={16} className="mr-2" />
                            Join Session
                        </Button>
                    )}

                    {/* Patient: Join Session button (only when session is LIVE) */}
                    {patientCanJoin && (
                        <Button
                            onClick={handleJoinSession}
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Video size={16} className="mr-2" />
                            Join Session
                        </Button>
                    )}

                    {/* Patient: Waiting message when session is scheduled and NOT a group session */}
                    {isPatient && session?.status === 'SCHEDULED' && session?.type !== 'GROUP' && (
                        <div className="flex items-center px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                            <Clock size={16} className="mr-2 text-yellow-500" />
                            <span className="text-yellow-500 text-sm">Waiting for psychologist to start</span>
                        </div>
                    )}

                    {/* Psychologist: Complete Session button (when LIVE) */}
                    {isPsychologist && isSessionLive && (
                        <Button
                            onClick={handleCompleteSession}
                            disabled={actionLoading}
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-500/10"
                        >
                            <Check size={16} className="mr-2" />
                            Complete Session
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-textMuted">Loading session details...</div>
            ) : !session ? (
                <div className="p-8 text-center text-textMuted">Session not found</div>
            ) : (
                <div className="space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                            {getStatusLabel(session.status)}
                        </span>
                        <span className="text-textMuted text-sm">{session.type}</span>
                    </div>

                    {/* Main Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Psychologist Card */}
                        <div className="rounded-lg border border-border bg-surface p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User size={20} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">Psychologist</p>
                                    <p className="text-lg font-semibold text-text">{session.psychologist ? session.psychologist.alias : <span className="italic text-textMuted">Unknown</span>}</p>
                                </div>
                            </div>
                            {session.psychologist?.bio && (
                                <p className="text-sm text-textMuted">{session.psychologist.bio}</p>
                            )}
                        </div>

                        {/* Patient / Participants Card */}
                        <div className="rounded-lg border border-border bg-surface p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.type === 'GROUP' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                                    }`}>
                                    <User size={20} className={session.type === 'GROUP' ? 'text-purple-400' : 'text-blue-400'} />
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">
                                        {session.type === 'GROUP' ? 'Title' : 'Title'}
                                    </p>
                                    <p className="text-lg font-semibold text-text">
                                        {session.type === 'GROUP' ? (
                                            session.title || 'Group Session'
                                        ) : (
                                            session.patient?.alias || <span className="italic text-textMuted">Not booked</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {session.type === 'GROUP' && session.participants && session.participants.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-xs font-medium text-textMuted mb-2 uppercase">Attending ({session.participants.length})</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {session.participants.map(p => (
                                            <div key={p.id} className="text-sm text-text flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                                {p.alias}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Session Details */}
                    <div className="rounded-lg border border-border bg-surface p-6">
                        <h3 className="text-lg font-semibold text-text mb-4">Session Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <Calendar className="text-primary mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-textMuted mb-1">Start Time</p>
                                    <p className="text-text font-medium">
                                        {new Date(session.startTime).toLocaleString('en-US', {
                                            dateStyle: 'full',
                                            timeStyle: 'short'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="text-primary mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-textMuted mb-1">End Time</p>
                                    <p className="text-text font-medium">
                                        {new Date(session.endTime).toLocaleString('en-US', {
                                            dateStyle: 'full',
                                            timeStyle: 'short'
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Clock className="text-primary mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-textMuted mb-1">Duration</p>
                                    <p className="text-text font-medium">{formatDuration(session.startTime, session.endTime)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <DollarSign className="text-primary mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-textMuted mb-1">Billing Breakdown</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between gap-4 text-sm">
                                            <span>Base Price:</span>
                                            <span className="text-text">${session.price?.toFixed(2) || '0.00'}</span>
                                        </div>
                                        {/* Fetch transaction details dynamically */}
                                        <BillingDetails sessionId={session.id} basePrice={session.price || 0} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Details */}
                    <div className="rounded-lg border border-border bg-surface p-6">
                        <h3 className="text-lg font-semibold text-text mb-4">Technical Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-textMuted">Session ID</span>
                                <span className="font-mono text-sm text-text">{session.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textMuted">Created At</span>
                                <span className="text-text">{new Date(session.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-textMuted">Psychologist ID</span>
                                <span className="font-mono text-sm text-text">{session.psychologistId}</span>
                            </div>
                            {session.patientId && (
                                <div className="flex justify-between">
                                    <span className="text-textMuted">Patient ID</span>
                                    <span className="font-mono text-sm text-text">{session.patientId}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionView;
