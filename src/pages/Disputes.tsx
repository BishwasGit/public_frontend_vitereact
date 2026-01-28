import { useState } from 'react';

const Disputes = () => {
    // Mock Data for MVP
    const [disputes] = useState([
        { id: '1', sessionId: 'sess_123', reporter: 'Client A', against: 'Dr. Freud', reason: 'Provider did not show up', status: 'PENDING', amount: 100 },
        { id: '2', sessionId: 'sess_456', reporter: 'Client B', against: 'Jung Official', reason: 'Connection issues', status: 'RESOLVED', amount: 50 },
    ]);

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold">Dispute Resolution</h2>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-textMuted">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Reporter</th>
                            <th className="p-4">Against</th>
                            <th className="p-4">Reason</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disputes.map((dispute) => (
                            <tr key={dispute.id} className="border-t border-border hover:bg-white/5">
                                <td className="p-4 font-mono text-sm text-textMuted">#{dispute.id}</td>
                                <td className="p-4 font-medium text-text">{dispute.reporter}</td>
                                <td className="p-4 text-text">{dispute.against}</td>
                                <td className="p-4 text-textMuted max-w-xs truncate" title={dispute.reason}>{dispute.reason}</td>
                                <td className="p-4 font-bold text-text">${dispute.amount}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${dispute.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-200' :
                                        dispute.status === 'REFUNDED' ? 'bg-red-900/50 text-red-200' :
                                            'bg-green-900/50 text-green-200' // Dismissed/Resolved
                                        }`}>
                                        {dispute.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => window.location.href = `/disputes/${dispute.id}`}
                                        className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Disputes;
