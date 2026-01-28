import { DollarSign, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client';

interface Psychologist {
    id: string;
    alias: string;
    balance: number;
    pendingWithdrawals: number;
    totalPayable: number;
}

interface PayablesData {
    totalPayable: number;
    psychologists: Psychologist[];
}

const Payables = () => {
    const [data, setData] = useState<PayablesData | null>(null);
    const [loading, setLoading] = useState(true);

    const loadPayables = async () => {
        try {
            setLoading(true);
            const res = await client.get('/reports/payables');
            setData(res.data.data || res.data || { totalPayable: 0, psychologists: [] });
        } catch (error) {
            console.error('Failed to load payables:', error);
            setData({ totalPayable: 0, psychologists: [] });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayables();
    }, []);

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold text-text">Payables Report</h2>

            {loading ? (
                <div className="p-8 text-center text-textMuted">Loading...</div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-lg border border-border bg-surface p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="text-primary" size={24} />
                                <p className="text-sm text-textMuted">Total Payable</p>
                            </div>
                            <p className="text-3xl font-bold text-green-400">${data.totalPayable.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-primary" size={24} />
                                <p className="text-sm text-textMuted">Psychologists</p>
                            </div>
                            <p className="text-3xl font-bold text-text">{data.psychologists.length}</p>
                        </div>
                    </div>

                    {/* Payables Table */}
                    <div className="overflow-hidden rounded-lg border border-border bg-surface">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-textMuted">
                                <tr>
                                    <th className="p-4">Psychologist</th>
                                    <th className="p-4">Wallet Balance</th>
                                    <th className="p-4">Pending Withdrawals</th>
                                    <th className="p-4">Total Payable</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.psychologists.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-textMuted">
                                            No payables found
                                        </td>
                                    </tr>
                                ) : (
                                    data.psychologists.map((psych) => (
                                        <tr key={psych.id} className="border-t border-border hover:bg-white/5">
                                            <td className="p-4 font-medium text-text">{psych.alias}</td>
                                            <td className="p-4 text-text">${psych.balance.toFixed(2)}</td>
                                            <td className="p-4 text-yellow-400">${psych.pendingWithdrawals.toFixed(2)}</td>
                                            <td className="p-4 font-bold text-green-400">${psych.totalPayable.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="p-8 text-center text-textMuted">Failed to load payables</div>
            )}
        </div>
    );
};

export default Payables;
