import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';

const TransactionHistory = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [loadingSession, setLoadingSession] = useState(false);

    useEffect(() => {
        if (userId) {
            loadTransactions();
        }
    }, [userId]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/reports/wallet-ledger/${userId}`);
            setTransactions(res.data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            toast.error('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    const handleSessionClick = async (tx: any) => {
        if (tx.referenceId) {
            try {
                setLoadingSession(true);
                const res = await client.get(`/sessions/${tx.referenceId}`);
                setSelectedSession(res.data);
            } catch (error) {
                console.error('Failed to load session details:', error);
                toast.error('Failed to load session details');
            } finally {
                setLoadingSession(false);
            }
        } else {
            toast.error('Session ID not found for this transaction');
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text">Transaction History</h2>
                    {transactions?.user && (
                        <p className="text-textMuted mt-1">{transactions.user.alias}'s complete transaction history</p>
                    )}
                </div>
                <Button variant="outline" onClick={() => navigate('/ledger-balances')}>
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Ledger
                </Button>
            </div>

            {loading ? (
                <div className="p-8 text-center text-textMuted">Loading transactions...</div>
            ) : transactions ? (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-2">Current Balance</p>
                            <p className="text-2xl font-bold text-green-400">${transactions.wallet.balance.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-2">Total Deposits</p>
                            <p className="text-2xl font-bold text-blue-400">${transactions.wallet.totalDeposits.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-2">Total Withdrawals</p>
                            <p className="text-2xl font-bold text-red-400">${transactions.wallet.totalWithdrawals.toFixed(2)}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-surface p-4">
                            <p className="text-sm text-textMuted mb-2">Total Earnings</p>
                            <p className="text-2xl font-bold text-green-400">${transactions.wallet.totalEarnings.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="rounded-lg border border-border bg-surface overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-white/5 text-textMuted">
                                    <tr>
                                        <th className="p-4 text-left">Date</th>
                                        <th className="p-4 text-left">Type</th>
                                        {transactions.user.role === 'PSYCHOLOGIST' ? (
                                            <>
                                                <th className="p-4 text-right">Earning Amount</th>
                                                <th className="p-4 text-right">Withdrawal Amount</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="p-4 text-right">Deposited Amount</th>
                                                <th className="p-4 text-right">Used Amount</th>
                                            </>
                                        )}
                                        <th className="p-4 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-textMuted">
                                                No transactions found
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.transactions.map((tx: any) => (
                                            <tr key={tx.id} className="border-t border-border hover:bg-white/5">
                                                <td className="p-4 text-textMuted">
                                                    {new Date(tx.createdAt).toLocaleString()}
                                                </td>
                                                <td className="p-4">
                                                    {tx.type.includes('SESSION') ? (
                                                        <button
                                                            onClick={() => handleSessionClick(tx)}
                                                            className="text-sm font-medium text-blue-400 hover:text-blue-300 underline cursor-pointer"
                                                        >
                                                            {tx.type}
                                                        </button>
                                                    ) : (
                                                        <span className="text-sm font-medium">{tx.type}</span>
                                                    )}
                                                </td>
                                                {/* Positive Amount Column */}
                                                <td className="p-4 text-right font-medium text-green-400">
                                                    {tx.amount > 0 ? `$${tx.amount.toFixed(2)}` : '-'}
                                                </td>
                                                {/* Negative Amount Column */}
                                                <td className="p-4 text-right font-medium text-red-400">
                                                    {tx.amount < 0 ? `$${Math.abs(tx.amount).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="p-4 text-right text-text font-medium">
                                                    ${tx.balance.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 text-center text-textMuted">Failed to load transaction history</div>
            )}

            {/* Session Details Dialog */}
            <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Session Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this therapy session
                        </DialogDescription>
                    </DialogHeader>
                    {loadingSession ? (
                        <div className="p-8 text-center text-textMuted">Loading session details...</div>
                    ) : selectedSession ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-textMuted">Psychologist</p>
                                    <p className="font-medium">{selectedSession.psychologist?.alias || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">Patient</p>
                                    <p className="font-medium">{selectedSession.patient?.alias || 'Not booked'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">Start Time</p>
                                    <p className="font-medium">
                                        {new Date(selectedSession.startTime).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">End Time</p>
                                    <p className="font-medium">
                                        {new Date(selectedSession.endTime).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">Price</p>
                                    <p className="font-medium text-green-400">${selectedSession.price.toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">Status</p>
                                    <p className={`font-medium ${
                                        selectedSession.status === 'COMPLETED' ? 'text-green-400' :
                                        selectedSession.status === 'SCHEDULED' ? 'text-blue-400' :
                                        selectedSession.status === 'LIVE' ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>
                                        {selectedSession.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">Type</p>
                                    <p className="font-medium">{selectedSession.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted">Session ID</p>
                                    <p className="font-mono text-xs text-textMuted">{selectedSession.id}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={() => {
                                        navigate(`/sessions/${selectedSession.id}`);
                                        setSelectedSession(null);
                                    }}
                                >
                                    View Full Details
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TransactionHistory;
