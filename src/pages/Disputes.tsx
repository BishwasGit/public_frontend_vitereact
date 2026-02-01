import { useEffect, useState } from 'react';
import client from '../api/client';

const Disputes = () => {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        try {
            const res = await client.get('/disputes');
            setDisputes(res.data.data || res.data); // Handle wrapper
        } catch (error) {
            console.error('Failed to load disputes', error);
        } finally {
            setLoading(false);
        }
    };

    const getAgainstName = (dispute: any) => {
        // If reporter is patient, against is psychologist, and vice versa
        if (dispute.reporterId === dispute.session.patientId) {
            return dispute.session.psychologist?.alias || 'Unknown Psychologist';
        } else {
            return dispute.session.patient?.alias || 'Unknown Patient';
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading disputes...</div>;

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold">Dispute Resolution</h2>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                {disputes.length === 0 ? (
                    <div className="p-8 text-center text-textMuted">No disputes found.</div>
                ) : (
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
                                    <td className="p-4 font-mono text-sm text-textMuted max-w-[100px] truncate" title={dispute.id}>#{dispute.id.slice(0, 8)}</td>
                                    <td className="p-4 font-medium text-text">{dispute.reporter?.alias || 'Unknown'}</td>
                                    <td className="p-4 text-text">{getAgainstName(dispute)}</td>
                                    <td className="p-4 text-textMuted max-w-xs truncate" title={dispute.description}>{dispute.reason}</td>
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
                )}
            </div>
        </div>
    );
};

export default Disputes;
