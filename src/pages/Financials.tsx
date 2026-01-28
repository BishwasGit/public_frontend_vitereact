import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client';

const Financials = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFinancials();
    }, []);

    const loadFinancials = async () => {
        try {
            const response = await client.get('/analytics/revenue');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load financials', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading financials...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text flex items-center gap-2">
                    <DollarSign size={32} className="text-primary" />
                    Financial Overview
                </h1>
                <p className="text-textMuted mt-2">Platform revenue and transaction analytics</p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-surface p-6 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-textMuted text-sm">Gross Revenue</span>
                        <TrendingUp className="text-green-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-text">${stats?.gross || 0}</p>
                    <p className="text-xs text-textMuted mt-1">Total earnings</p>
                </div>

                <div className="bg-surface p-6 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-textMuted text-sm">Net Revenue</span>
                        <Wallet className="text-blue-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-text">${stats?.net || 0}</p>
                    <p className="text-xs text-textMuted mt-1">After fees</p>
                </div>

                <div className="bg-surface p-6 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-textMuted text-sm">Platform Fees</span>
                        <DollarSign className="text-primary" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-text">${stats?.platformFees || 0}</p>
                    <p className="text-xs text-textMuted mt-1">Commission earned</p>
                </div>

                <div className="bg-surface p-6 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-textMuted text-sm">Refunds</span>
                        <TrendingDown className="text-red-500" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-text">${stats?.refunds || 0}</p>
                    <p className="text-xs text-textMuted mt-1">Total refunded</p>
                </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-surface rounded-xl border border-border p-6">
                <h2 className="text-xl font-bold text-text mb-4">Transaction Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-textMuted text-sm mb-2">Period</p>
                        <p className="text-text font-medium">{stats?.period || 'Last Month'}</p>
                    </div>
                    <div>
                        <p className="text-textMuted text-sm mb-2">Total Transactions</p>
                        <p className="text-text font-medium">{stats?.transactionCount || 0}</p>
                    </div>
                </div>
            </div>

            {/* Placeholder for charts */}
            <div className="mt-8 bg-surface rounded-xl border border-border p-6">
                <h2 className="text-xl font-bold text-text mb-4">Revenue Trends</h2>
                <div className="h-64 flex items-center justify-center text-textMuted">
                    <p>Revenue chart coming soon...</p>
                </div>
            </div>
        </div>
    );
};

export default Financials;
