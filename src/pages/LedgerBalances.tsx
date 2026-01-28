import { Eye, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

interface User {
    id: string;
    alias: string;
    balance: number;
    pendingWithdrawals?: number;
}

interface LedgerBalances {
    totalBalance: number;
    psychologists: {
        count: number;
        totalBalance: number;
        users: User[];
    };
    patients: {
        count: number;
        totalBalance: number;
        users: User[];
    };
}

const LedgerBalances = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<LedgerBalances | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'psychologists' | 'patients'>('psychologists');

    const loadBalances = async () => {
        try {
            setLoading(true);
            const res = await client.get('/reports/ledger-balances');
            setData(res.data.data || res.data || {
                totalBalance: 0,
                psychologists: { count: 0, totalBalance: 0, users: [] },
                patients: { count: 0, totalBalance: 0, users: [] }
            });
        } catch (error) {
            console.error('Failed to load ledger balances:', error);
            setData({
                totalBalance: 0,
                psychologists: { count: 0, totalBalance: 0, users: [] },
                patients: { count: 0, totalBalance: 0, users: [] }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBalances();
    }, []);

    const activeUsers = activeTab === 'psychologists' ? data?.psychologists.users : data?.patients.users;

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold text-text">Ledger Balances</h2>

            {loading ? (
                <div className="p-8 text-center text-textMuted">Loading...</div>
            ) : data ? (
                <>
                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-border bg-surface p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <TrendingUp className="text-primary" size={24} />
                                <p className="text-sm text-textMuted">Total Platform Balance</p>
                            </div>
                            <p className="text-3xl font-bold text-green-400">${data.totalBalance.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-blue-400" size={24} />
                                <p className="text-sm text-textMuted">Psychologists</p>
                            </div>
                            <p className="text-2xl font-bold text-text">{data.psychologists.count}</p>
                            <p className="text-sm text-textMuted mt-1">${data.psychologists.totalBalance.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="text-green-400" size={24} />
                                <p className="text-sm text-textMuted">Patients</p>
                            </div>
                            <p className="text-2xl font-bold text-text">{data.patients.count}</p>
                            <p className="text-sm text-textMuted mt-1">${data.patients.totalBalance.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-4 flex gap-2">
                        <button
                            onClick={() => setActiveTab('psychologists')}
                            className={`rounded-lg px-4 py-2 font-medium transition-colors ${activeTab === 'psychologists'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-textMuted hover:bg-white/5'
                                }`}
                        >
                            Psychologists ({data.psychologists.count})
                        </button>
                        <button
                            onClick={() => setActiveTab('patients')}
                            className={`rounded-lg px-4 py-2 font-medium transition-colors ${activeTab === 'patients'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-textMuted hover:bg-white/5'
                                }`}
                        >
                            Patients ({data.patients.count})
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="overflow-hidden rounded-lg border border-border bg-surface">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-textMuted">
                                <tr>
                                    <th className="p-4">User</th>
                                    <th className="p-4">Wallet Balance</th>
                                    {activeTab === 'psychologists' && (
                                        <th className="p-4">Pending Withdrawals</th>
                                    )}
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!activeUsers || activeUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === 'psychologists' ? 3 : 2} className="p-8 text-center text-textMuted">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    activeUsers.map((user) => (
                                        <tr key={user.id} className="border-t border-border hover:bg-white/5">
                                            <td className="p-4 font-medium text-text">{user.alias}</td>
                                            <td className="p-4 text-green-400 font-medium">${user.balance.toFixed(2)}</td>
                                            {activeTab === 'psychologists' && (
                                                <td className="p-4 text-yellow-400">
                                                    ${(user.pendingWithdrawals || 0).toFixed(2)}
                                                </td>
                                            )}
                                            <td className="p-4">
                                                <button
                                                    onClick={() => navigate(`/transaction-history/${user.id}`)}
                                                    className="rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
                                                    title="View Transactions"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="p-8 text-center text-textMuted">Failed to load balances</div>
            )}
        </div>
    );
};

export default LedgerBalances;
