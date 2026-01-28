import client from '@/api/client';
import { EmptyState, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, Clock, CreditCard, Wallet as WalletIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Wallet = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [walletRes, txRes] = await Promise.all([
                client.get('/wallet/balance'),
                client.get('/wallet/transactions')
            ]);
            setBalance(walletRes.data.data?.balance || walletRes.data?.balance || 0);
            setTransactions(txRes.data.data || txRes.data || []);
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="My Wallet"
                description="Manage your balance and transactions"
                icon={<WalletIcon size={24} className="text-primary" />}
            />

            {/* Balance Card */}
            <div className="mb-6 rounded-lg border border-border bg-gradient-to-br from-primary/20 to-purple-500/20 p-8">
                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                        <p className="text-sm text-textMuted mb-2">Available Balance</p>
                        <h2 className="text-4xl font-bold text-text">${balance.toFixed(2)}</h2>
                    </div>
                    <WalletIcon size={48} className="text-primary opacity-50" />
                </div>
                <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <Button
                        className="flex-1"
                        onClick={() => navigate('/add-funds')}
                    >
                        <ArrowDownLeft size={16} className="mr-2" />
                        Add Funds
                    </Button>
                    <div className="flex-1 flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate('/withdraw-funds')}
                        >
                            <ArrowUpRight size={16} className="mr-2" />
                            Withdraw
                        </Button>
                        <Button
                            variant="outline"
                            className="w-12 px-0"
                            title="Manage Payment Methods"
                            onClick={() => navigate('/payment-methods')}
                        >
                            <CreditCard size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                    onClick={() => navigate('/payment-methods')}
                    className="rounded-lg border border-border bg-surface p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                    <CreditCard className="mx-auto mb-3 text-primary" size={32} />
                    <h3 className="font-semibold text-text mb-1">Payment Methods</h3>
                    <p className="text-sm text-textMuted">Manage cards & banks</p>
                </div>
                <div
                    onClick={() => navigate('/add-funds')}
                    className="rounded-lg border border-border bg-surface p-6 text-center cursor-pointer hover:border-green-500 transition-colors"
                >
                    <ArrowDownLeft className="mx-auto mb-3 text-green-400" size={32} />
                    <h3 className="font-semibold text-text mb-1">Top Up</h3>
                    <p className="text-sm text-textMuted">Add funds to wallet</p>
                </div>
                {/* <div className="rounded-lg border border-border bg-surface p-6 text-center">
                    <ArrowUpRight className="mx-auto mb-3 text-blue-400" size={32} />
                    <h3 className="font-semibold text-text mb-1">Transactions</h3>
                    <p className="text-sm text-textMuted">View transaction history</p>
                </div> */}
            </div>

            {/* Recent Transactions */}
            <div className="rounded-lg border border-border bg-surface p-6">
                <h3 className="text-lg font-semibold text-text mb-4">Recent Transactions</h3>
                {loading ? (
                    <div className="text-center py-8 text-textMuted">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                    <EmptyState message="No transactions yet." />
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        ${tx.type === 'DEPOSIT' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
                                    `}>
                                        {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-text">{tx.referenceId || tx.description || tx.type}</p>
                                        <div className="flex items-center gap-2 text-xs text-textMuted">
                                            <Clock size={12} />
                                            <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' :
                                                tx.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' :
                                                    'bg-red-500/10 text-red-600'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`font-bold ${tx.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                    {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;
