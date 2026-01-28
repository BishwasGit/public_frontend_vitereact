import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

const Earnings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<any[]>([]);
    const [wallet, setWallet] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sessionsRes, walletRes] = await Promise.all([
                client.get('/sessions'),
                client.get('/wallet/balance'),
            ]);

            const mySessions = Array.isArray(sessionsRes.data.data || sessionsRes.data)
                ? (sessionsRes.data.data || sessionsRes.data).filter((s: any) => s.psychologistId === user?.id)
                : [];
            setSessions(mySessions);
            setWallet(walletRes.data.data || walletRes.data);
        } catch (error) {
            console.error('Failed to load earnings:', error);
            toast.error('Failed to load earnings data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading earnings...</div>;

    const completedSessions = sessions.filter(s => ['COMPLETED', 'SCHEDULED', 'LIVE'].includes(s.status));
    const totalEarnings = completedSessions.reduce((sum, s) => sum + ((s.price || 0) * 0.9), 0);

    // Calculate monthly earnings (last 6 months)
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });

        const monthEarnings = completedSessions
            .filter(s => {
                const sessionDate = new Date(s.startTime);
                return sessionDate.getMonth() === date.getMonth() &&
                    sessionDate.getFullYear() === date.getFullYear();
            })
            .reduce((sum, s) => sum + ((s.price || 0) * 0.9), 0);

        return {
            month: monthName,
            earnings: monthEarnings,
        };
    });

    // This month's earnings
    const now = new Date();
    const thisMonthEarnings = completedSessions
        .filter(s => {
            const sessionDate = new Date(s.startTime);
            return sessionDate.getMonth() === now.getMonth() &&
                sessionDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, s) => sum + ((s.price || 0) * 0.9), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text">My Earnings</h1>
                    <p className="text-textMuted mt-1">Track your income and financial performance</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/withdraw-funds')}>
                    <DollarSign size={16} className="mr-2" />
                    Request Withdrawal
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Total Earnings" value={`$${totalEarnings.toFixed(2)}`} color="text-green-600" />
                <StatCard label="This Month" value={`$${thisMonthEarnings.toFixed(2)}`} color="text-blue-600" />
                <StatCard label="Wallet Balance" value={`$${wallet?.balance?.toFixed(2) || '0.00'}`} color="text-purple-600" />
                <StatCard label="Completed Sessions" value={completedSessions.length} color="text-orange-600" />
            </div>

            {/* Monthly Earnings Chart */}
            <div className="bg-surface p-6 rounded-xl border border-border">
                <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    Monthly Earnings (Last 6 Months)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Earnings']}
                        />
                        <Bar dataKey="earnings" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Session Breakdown */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text">Session Breakdown</h2>
                    <Button variant="outline" size="sm">
                        <Download size={16} className="mr-2" />
                        Export
                    </Button>
                </div>
                {completedSessions.length === 0 ? (
                    <div className="p-12 text-center text-textMuted">No completed sessions yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background">
                                <tr>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Date</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Patient</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Type</th>
                                    <th className="text-left p-4 text-sm font-semibold text-text">Duration</th>
                                    <th className="text-right p-4 text-sm font-semibold text-text">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedSessions.slice(0, 20).map((session) => (
                                    <tr key={session.id} className="border-b border-border hover:bg-background transition-colors">
                                        <td className="p-4 text-sm text-textMuted">
                                            {new Date(session.startTime).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-sm text-text font-medium">
                                            {session.patient?.alias || 'Patient'}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">
                                                {session.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-textMuted">
                                            {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min
                                        </td>
                                        <td className="p-4 text-right text-sm font-bold text-green-600">
                                            ${((session.price || 0) * 0.9).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="bg-surface p-6 rounded-xl border border-border">
        <p className="text-textMuted text-sm font-medium mb-1">{label}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

export default Earnings;
