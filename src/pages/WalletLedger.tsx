import { Download, Search } from 'lucide-react';
import { useState } from 'react';
import client from '../api/client';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    balance: number;
    description: string;
    status: string;
    createdAt: string;
}

interface WalletLedger {
    user: {
        id: string;
        alias: string;
        role: string;
    };
    wallet: {
        balance: number;
        totalDeposits: number;
        totalWithdrawals: number;
        totalEarnings: number;
        totalSpent: number;
    };
    transactions: Transaction[];
    summary: {
        depositsCount: number;
        withdrawalsCount: number;
        sessionsCount: number;
    };
}

const WalletLedger = () => {
    const [userId, setUserId] = useState('');
    const [ledger, setLedger] = useState<WalletLedger | null>(null);
    const [loading, setLoading] = useState(false);

    const loadLedger = async () => {
        if (!userId.trim()) {
            alert('Please enter a user ID');
            return;
        }

        try {
            setLoading(true);
            const res = await client.get(`/reports/wallet-ledger/${userId}`);
            setLedger(res.data.data || res.data);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to load wallet ledger');
            setLedger(null);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!ledger) return;

        const csvContent = [
            ['Date', 'Type', 'Amount', 'Balance', 'Description', 'Status'].join(','),
            ...ledger.transactions.map(tx => [
                new Date(tx.createdAt).toISOString(),
                tx.type,
                tx.amount,
                tx.balance,
                tx.description,
                tx.status,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet-ledger-${ledger.user.alias}-${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold text-text">Wallet Ledger Report</h2>

            {/* Search */}
            <div className="mb-6 flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
                    <input
                        type="text"
                        placeholder="Enter user ID..."
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && loadLedger()}
                        className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button
                    onClick={loadLedger}
                    disabled={loading}
                    className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Load Ledger'}
                </button>
            </div>

            {ledger && (
                <>
                    {/* User Info & Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-1">User</p>
                            <p className="text-lg font-bold text-text">{ledger.user.alias}</p>
                            <p className="text-xs text-textMuted">{ledger.user.role}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-1">Current Balance</p>
                            <p className="text-2xl font-bold text-green-400">${ledger.wallet.balance.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-1">Total Deposits</p>
                            <p className="text-xl font-bold text-text">${ledger.wallet.totalDeposits.toFixed(2)}</p>
                            <p className="text-xs text-textMuted">{ledger.summary.depositsCount} transactions</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-1">Total Withdrawals</p>
                            <p className="text-xl font-bold text-text">${ledger.wallet.totalWithdrawals.toFixed(2)}</p>
                            <p className="text-xs text-textMuted">{ledger.summary.withdrawalsCount} transactions</p>
                        </div>
                    </div>

                    {/* Export Button */}
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-text hover:bg-white/5"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-hidden rounded-lg border border-border bg-surface">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-textMuted">
                                <tr>
                                    <th className="p-4">Date & Time</th>
                                    <th className="p-4">Type</th>
                                    <th className="p-4">Amount</th>
                                    <th className="p-4">Balance</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ledger.transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-textMuted">
                                            No transactions found
                                        </td>
                                    </tr>
                                ) : (
                                    ledger.transactions.map((tx) => (
                                        <tr key={tx.id} className="border-t border-border hover:bg-white/5">
                                            <td className="p-4 text-textMuted">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tx.type === 'DEPOSIT' ? 'bg-green-900/50 text-green-200' :
                                                        tx.type === 'WITHDRAWAL' ? 'bg-red-900/50 text-red-200' :
                                                            'bg-blue-900/50 text-blue-200'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`p-4 font-medium ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                            </td>
                                            <td className="p-4 font-medium text-text">
                                                ${tx.balance.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-textMuted">{tx.description}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-900/50 text-green-200' :
                                                        tx.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-200' :
                                                            'bg-red-900/50 text-red-200'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default WalletLedger;
