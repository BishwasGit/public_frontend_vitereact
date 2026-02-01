import { Check, CheckCheck, DollarSign, X, Eye, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client';

interface WithdrawalRequest {
    id: string;
    user: {
        id: string;
        alias: string;
        role: string;
    };
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    requestedAt: string;
    reviewedAt?: string;
    reviewer?: {
        alias: string;
    };
    rejectionReason?: string;
    payoutDetails?: {
        type: string;
        details: any;
    };
}

const WithdrawalRequests = () => {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [pendingCount, setPendingCount] = useState(0);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const res = await client.get(`/withdrawal-requests${params}`);
            setRequests(res.data.data || res.data || []);
        } catch (error) {
            console.error('Failed to load withdrawal requests:', error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingCount = async () => {
        try {
            const res = await client.get('/withdrawal-requests/pending-count');
            const data = res.data.data || res.data;
            setPendingCount(data.count || 0);
        } catch (error) {
            console.error('Failed to load pending count:', error);
            setPendingCount(0);
        }
    };

    useEffect(() => {
        loadRequests();
        loadPendingCount();
    }, [statusFilter]);

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to approve this withdrawal request? This will deduct the amount from the user\'s wallet.')) return;

        try {
            console.log('Approving request:', id);
            await client.patch(`/withdrawal-requests/${id}/approve`);
            alert('Withdrawal request approved successfully');
            loadRequests();
            loadPendingCount();
        } catch (error: any) {
            console.error('Approve error:', error);
            alert(error.response?.data?.message || 'Failed to approve request');
        }
    };

    const handleComplete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const proof = window.prompt('Enter transaction ID / Payment Proof (optional):', 'Manual Transfer');
        if (proof === null) return; // Cancelled

        try {
            console.log('Completing request:', id);
            await client.patch(`/withdrawal-requests/${id}/complete-payment`, {
                paymentProof: proof
            });
            alert('Withdrawal marked as completed');
            loadRequests();
        } catch (error: any) {
            console.error('Complete error:', error);
            alert(error.response?.data?.message || 'Failed to complete request');
        }
    };

    const handleReject = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click
        if (!selectedRequest || !rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await client.patch(`/withdrawal-requests/${selectedRequest.id}/reject`, {
                reason: rejectionReason,
            });
            alert('Withdrawal request rejected');
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
            loadRequests();
            loadPendingCount();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to reject request');
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text">Withdrawal Requests</h2>
                    {pendingCount > 0 && (
                        <p className="text-sm text-textMuted mt-1">
                            {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Withdrawal Requests Table */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-textMuted">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Payout Details</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Requested</th>
                            <th className="p-4">Reviewed By</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-textMuted">
                                    Loading...
                                </td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-textMuted">
                                    No withdrawal requests found
                                </td>
                            </tr>
                        ) : (
                            requests.map((request) => (
                                <tr key={request.id} className="border-t border-border hover:bg-white/5">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-text">{request.user.alias}</span>
                                            <span className="text-xs text-textMuted">{request.user.role}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 font-medium text-text">
                                            <DollarSign size={16} />
                                            {request.amount.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {request.payoutDetails ? (
                                            <div className="text-sm">
                                                <div className="flex items-center gap-1 font-medium text-text mb-1">
                                                    <CreditCard size={14} />
                                                    {request.payoutDetails.type}
                                                </div>
                                                <div className="text-xs text-textMuted space-y-0.5">
                                                    {request.payoutDetails.type === 'BANK' ? (
                                                        <>
                                                            <div>{request.payoutDetails.details.bankName}</div>
                                                            <div>{request.payoutDetails.details.accountName}</div>
                                                            <div>{request.payoutDetails.details.accountNumber}</div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div>ID: {request.payoutDetails.details.mobileNumber}</div>
                                                            {request.payoutDetails.details.qrCode && (
                                                                <button
                                                                    onClick={() => {
                                                                        setQrUrl(`${client.defaults.baseURL}/payout-methods/qr/${request.payoutDetails!.details.qrCode}`);
                                                                        setShowQrModal(true);
                                                                    }}
                                                                    className="flex items-center gap-1 text-primary hover:underline mt-1"
                                                                >
                                                                    <Eye size={12} />
                                                                    View QR
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-textMuted text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${request.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-200' :
                                            request.status === 'APPROVED' ? 'bg-green-900/50 text-green-200' :
                                                'bg-red-900/50 text-red-200'
                                            }`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-textMuted">
                                        {new Date(request.requestedAt).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-textMuted">
                                        {request.reviewer?.alias || '-'}
                                    </td>
                                    <td className="p-4">
                                        {request.status === 'PENDING' ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => handleApprove(request.id, e)}
                                                    className="rounded bg-green-600 p-2 text-white hover:bg-green-700"
                                                    title="Approve (Deduct Balance)"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedRequest(request);
                                                        setShowRejectModal(true);
                                                    }}
                                                    className="rounded bg-red-600 p-2 text-white hover:bg-red-700"
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : request.status === 'APPROVED' ? (
                                            <button
                                                onClick={(e) => handleComplete(request.id, e)}
                                                className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                                                title="Mark as Paid"
                                            >
                                                <CheckCheck size={14} />
                                                Mark Paid
                                            </button>
                                        ) : request.status === 'REJECTED' && request.rejectionReason ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    alert(request.rejectionReason);
                                                }}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                View Reason
                                            </button>
                                        ) : (
                                            <span className="text-textMuted">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-surface p-6 border border-border">
                        <h3 className="mb-4 text-xl font-bold text-text">Reject Withdrawal Request</h3>
                        <p className="mb-4 text-textMuted">
                            User: <span className="font-medium text-text">{selectedRequest.user.alias}</span><br />
                            Amount: <span className="font-medium text-text">${selectedRequest.amount.toFixed(2)}</span>
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection..."
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                            rows={4}
                        />
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={handleReject}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                            >
                                Reject Request
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedRequest(null);
                                    setRejectionReason('');
                                }}
                                className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-text hover:bg-white/5"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {showQrModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowQrModal(false)}>
                    <div className="relative max-w-lg w-full p-4" onClick={e => e.stopPropagation()}>
                        <button
                            className="absolute -top-10 right-0 text-white hover:text-gray-300"
                            onClick={() => setShowQrModal(false)}
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={qrUrl}
                            alt="Payment QR Code"
                            className="w-full rounded-lg"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Failed+to+load+QR';
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithdrawalRequests;
