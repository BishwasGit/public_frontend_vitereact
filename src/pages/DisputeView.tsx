import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Dispute {
    id: string;
    sessionId: string;
    reporter: string;
    reporterEmail: string;
    against: string;
    againstEmail: string;
    reason: string;
    description: string;
    status: 'PENDING' | 'RESOLVED' | 'REFUNDED' | 'DISMISSED';
    amount: number;
    createdAt: string;
    sessionDate: string;
}

// Mock data - in production, fetch from API
const mockDisputes: Record<string, Dispute> = {
    '1': {
        id: '1',
        sessionId: 'sess_123',
        reporter: 'Client A',
        reporterEmail: 'clienta@example.com',
        against: 'Dr. Freud',
        againstEmail: 'freud@example.com',
        reason: 'Provider did not show up',
        description: 'I scheduled a session for 3:00 PM on December 15th, 2025. I waited for 20 minutes but the psychologist never joined the video call. I tried refreshing the page and checking my internet connection, but the issue persisted. This is very unprofessional and I would like a full refund for this session.',
        status: 'PENDING',
        amount: 100,
        createdAt: '2025-12-15T15:25:00Z',
        sessionDate: '2025-12-15T15:00:00Z'
    },
    '2': {
        id: '2',
        sessionId: 'sess_456',
        reporter: 'Client B',
        reporterEmail: 'clientb@example.com',
        against: 'Jung Official',
        againstEmail: 'jung@example.com',
        reason: 'Connection issues',
        description: 'During our session, there were constant connection drops and audio issues. The psychologist kept freezing and I could barely hear them. We tried reconnecting multiple times but the problem continued throughout the entire session. I feel like I didn\'t get the full value of the session due to these technical difficulties.',
        status: 'RESOLVED',
        amount: 50,
        createdAt: '2025-12-14T10:30:00Z',
        sessionDate: '2025-12-14T10:00:00Z'
    },
};

const DisputeView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [dispute, setDispute] = useState<Dispute | null>(
        id ? mockDisputes[id] : null
    );
    const [settling, setSettling] = useState(false);

    if (!dispute) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-2xl font-bold text-text mb-4">Dispute Not Found</h2>
                <button
                    onClick={() => navigate('/disputes')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    <ArrowLeft size={20} />
                    Back to Disputes
                </button>
            </div>
        );
    }

    const handleSettle = async (decision: 'REFUND' | 'DISMISS') => {
        if (!confirm(`Are you sure you want to ${decision.toLowerCase()} this dispute?`)) {
            return;
        }

        setSettling(true);

        // Simulate API call
        setTimeout(() => {
            setDispute({
                ...dispute,
                status: decision === 'REFUND' ? 'REFUNDED' : 'DISMISSED'
            });
            setSettling(false);
            alert(`Dispute ${decision.toLowerCase()}ed successfully!`);
        }, 1000);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/disputes')}
                        className="flex items-center gap-2 text-textMuted hover:text-text transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h2 className="text-2xl font-bold text-text">Dispute #{dispute.id}</h2>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${dispute.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-200' :
                        dispute.status === 'REFUNDED' ? 'bg-red-900/50 text-red-200' :
                            'bg-green-900/50 text-green-200'
                    }`}>
                    {dispute.status}
                </span>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Overview Card */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-textMuted mb-1">Session ID</p>
                            <p className="font-mono text-text">{dispute.sessionId}</p>
                        </div>
                        <div>
                            <p className="text-sm text-textMuted mb-1">Amount</p>
                            <p className="text-xl font-bold text-text">${dispute.amount}</p>
                        </div>
                        <div>
                            <p className="text-sm text-textMuted mb-1">Session Date</p>
                            <p className="text-text">{formatDate(dispute.sessionDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-textMuted mb-1">Reported On</p>
                            <p className="text-text">{formatDate(dispute.createdAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Parties Involved */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">Parties Involved</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-textMuted mb-2">Reporter (Client)</p>
                            <p className="font-medium text-text">{dispute.reporter}</p>
                            <p className="text-sm text-textMuted">{dispute.reporterEmail}</p>
                        </div>
                        <div>
                            <p className="text-sm text-textMuted mb-2">Against (Psychologist)</p>
                            <p className="font-medium text-text">{dispute.against}</p>
                            <p className="text-sm text-textMuted">{dispute.againstEmail}</p>
                        </div>
                    </div>
                </div>

                {/* Reason */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-text mb-2">Reason</h3>
                    <p className="text-text font-medium">{dispute.reason}</p>
                </div>

                {/* Full Description */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-text mb-4">Full Description</h3>
                    <div className="bg-background/50 rounded-lg p-4 border border-border">
                        <p className="text-text leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
                    </div>
                </div>

                {/* Settlement Actions */}
                {dispute.status === 'PENDING' && (
                    <div className="bg-surface border border-border rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-text mb-4">Settlement Actions</h3>
                        <p className="text-textMuted mb-6">
                            Review the dispute details above and choose an action. This decision is final and cannot be undone.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleSettle('REFUND')}
                                disabled={settling}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                <CheckCircle size={20} />
                                {settling ? 'Processing...' : 'Approve Refund'}
                            </button>
                            <button
                                onClick={() => handleSettle('DISMISS')}
                                disabled={settling}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                <XCircle size={20} />
                                {settling ? 'Processing...' : 'Dismiss Dispute'}
                            </button>
                        </div>
                        <p className="text-xs text-textMuted mt-4 text-center">
                            <strong>Approve Refund:</strong> Client will receive a full refund. Psychologist will not be paid.
                            <br />
                            <strong>Dismiss:</strong> No refund will be issued. Psychologist will be paid as normal.
                        </p>
                    </div>
                )}

                {/* Resolution Info */}
                {dispute.status !== 'PENDING' && (
                    <div className={`border rounded-xl p-6 ${dispute.status === 'REFUNDED'
                            ? 'bg-red-900/20 border-red-800'
                            : 'bg-green-900/20 border-green-800'
                        }`}>
                        <h3 className="text-lg font-semibold text-text mb-2">Resolution</h3>
                        <p className="text-text">
                            {dispute.status === 'REFUNDED'
                                ? 'This dispute was resolved in favor of the client. A full refund has been issued.'
                                : 'This dispute was dismissed. No refund was issued.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DisputeView;
