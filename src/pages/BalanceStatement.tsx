import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowDownCircle, ArrowUpCircle, Download, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const BalanceStatement = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const walletRes = await client.get('/wallet/balance');
            setWallet(walletRes.data.data || walletRes.data);

            // Build transaction history from wallet and sessions
            const sessionsRes = await client.get('/sessions');
            const sessionData = sessionsRes.data.data || sessionsRes.data;
            const userSessions = Array.isArray(sessionData)
                ? sessionData.filter((s: any) =>
                    user?.role === 'PATIENT' ? s.patientId === user?.id : s.psychologistId === user?.id
                )
                : [];

            // Create transaction records
            const txns: any[] = [];

            // Add session transactions
            userSessions.forEach((session: any) => {
                if (['COMPLETED', 'SCHEDULED', 'LIVE'].includes(session.status)) {
                    if (user?.role === 'PATIENT') {
                        txns.push({
                            id: `session-${session.id}`,
                            date: new Date(session.startTime),
                            description: `Session with ${session.psychologist?.alias || 'Psychologist'}`,
                            type: 'SESSION_PAYMENT',
                            credit: 0,
                            debit: session.price || 0,
                        });
                    } else {
                        txns.push({
                            id: `session-${session.id}`,
                            date: new Date(session.startTime),
                            description: `Session with ${session.patient?.alias || 'Patient'}`,
                            type: 'SESSION_EARNING',
                            credit: (session.price || 0) * 0.9,
                            debit: 0,
                        });
                    }
                }
            });

            // Sort by date descending
            txns.sort((a, b) => b.date.getTime() - a.date.getTime());

            // Calculate running balance
            let balance = wallet?.balance || 0;
            const txnsWithBalance = txns.map((txn) => {
                const txnBalance = balance;
                balance = balance - txn.credit + txn.debit;
                return { ...txn, balance: txnBalance };
            }).reverse();

            setTransactions(txnsWithBalance);
        } catch (error) {
            console.error('Failed to load balance statement:', error);
            toast.error('Failed to load balance statement');
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(txn => {
        if (!dateFilter.start && !dateFilter.end) return true;
        const txnDate = new Date(txn.date);
        if (dateFilter.start && txnDate < new Date(dateFilter.start)) return false;
        if (dateFilter.end && txnDate > new Date(dateFilter.end)) return false;
        return true;
    });

    const totalCredit = filteredTransactions.reduce((sum, txn) => sum + txn.credit, 0);
    const totalDebit = filteredTransactions.reduce((sum, txn) => sum + txn.debit, 0);

    const handleExport = () => {
        import('jspdf').then(({ default: jsPDF }) => {
            import('jspdf-autotable').then(({ default: autoTable }) => {
                const doc = new jsPDF();

                doc.setFontSize(18);
                doc.text('Balance Statement', 14, 22);

                doc.setFontSize(11);
                doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
                doc.text(`User: ${user?.alias || (user as any)?.email}`, 14, 36);

                const tableColumn = ["Date", "Description", "Credit", "Debit", "Balance"];
                const tableRows: any[] = [];

                filteredTransactions.forEach(ticket => {
                    const ticketData = [
                        new Date(ticket.date).toLocaleDateString(),
                        ticket.description,
                        ticket.credit > 0 ? `$${ticket.credit.toFixed(2)}` : '-',
                        ticket.debit > 0 ? `$${ticket.debit.toFixed(2)}` : '-',
                        `$${ticket.balance.toFixed(2)}`,
                    ];
                    tableRows.push(ticketData);
                });

                // @ts-ignore
                autoTable(doc, {
                    startY: 40,
                    head: [tableColumn],
                    body: tableRows,
                    theme: 'grid',
                    styles: { fontSize: 9 },
                    headStyles: { fillColor: [59, 130, 246] }, // Blue-500
                });

                doc.save(`balance-statement_${new Date().toISOString().slice(0, 10)}.pdf`);
                toast.success('Statement downloaded successfully');
            });
        });
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading balance statement...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">Balance Statement</h1>
                    <p className="text-textMuted mt-1">
                        {user?.role === 'PATIENT' ? 'Your transaction history and wallet balance' : 'Your earnings and withdrawal history'}
                    </p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download size={16} className="mr-2" />
                    Export PDF
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                    icon={<FileText size={20} />}
                    label="Current Balance"
                    value={`$${wallet?.balance?.toFixed(2) || '0.00'}`}
                    color="bg-blue-500/10 text-blue-600"
                />
                <SummaryCard
                    icon={<ArrowUpCircle size={20} />}
                    label={user?.role === 'PATIENT' ? 'Total Added' : 'Total Earned'}
                    value={`$${totalCredit.toFixed(2)}`}
                    color="bg-green-500/10 text-green-600"
                />
                <SummaryCard
                    icon={<ArrowDownCircle size={20} />}
                    label={user?.role === 'PATIENT' ? 'Total Spent' : 'Total Withdrawn'}
                    value={`$${totalDebit.toFixed(2)}`}
                    color="bg-red-500/10 text-red-600"
                />
                <SummaryCard
                    icon={<FileText size={20} />}
                    label="Transactions"
                    value={filteredTransactions.length}
                    color="bg-purple-500/10 text-purple-600"
                />
            </div>

            {/* Filters */}
            <div className="bg-surface p-4 rounded-xl border border-border">
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-text mb-2 block">From Date</label>
                        <input
                            type="date"
                            value={dateFilter.start}
                            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-text mb-2 block">To Date</label>
                        <input
                            type="date"
                            value={dateFilter.end}
                            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setDateFilter({ start: '', end: '' })}
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold text-text">Date</th>
                                <th className="text-left p-4 text-sm font-semibold text-text">Description</th>
                                <th className="text-right p-4 text-sm font-semibold text-text">Credit</th>
                                <th className="text-right p-4 text-sm font-semibold text-text">Debit</th>
                                <th className="text-right p-4 text-sm font-semibold text-text">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-textMuted">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((txn) => (
                                    <tr key={txn.id} className="border-b border-border hover:bg-background transition-colors">
                                        <td className="p-4 text-sm text-textMuted">
                                            {new Date(txn.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm text-text">{txn.description}</td>
                                        <td className="p-4 text-right text-sm font-semibold text-green-600">
                                            {txn.credit > 0 ? `$${txn.credit.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="p-4 text-right text-sm font-semibold text-red-600">
                                            {txn.debit > 0 ? `$${txn.debit.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="p-4 text-right text-sm font-bold text-text">
                                            ${txn.balance.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ icon, label, value, color }: any) => (
    <div className="bg-surface p-6 rounded-xl border border-border">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
            {icon}
        </div>
        <p className="text-textMuted text-sm font-medium">{label}</p>
        <p className="text-2xl font-bold text-text mt-1">{value}</p>
    </div>
);

export default BalanceStatement;
