import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import SessionRequests from '@/components/SessionRequests';
import StatusSelector from '@/components/StatusSelector';
import { Calendar, DollarSign, TrendingUp, Users, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PsychologistDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch wallet
            try {
                const walletRes = await client.get('/wallet/balance');
                setWallet(walletRes.data.data || walletRes.data || { balance: 0 });
            } catch (e) {
                console.warn('Wallet endpoint not available, using default');
                setWallet({ balance: 0 });
            }

            // Fetch sessions
            try {
                const sessionsRes = await client.get('/sessions');
                const sessionsData = sessionsRes.data.data || sessionsRes.data || [];
                const mySessions = Array.isArray(sessionsData)
                    ? sessionsData.filter((s: any) => s.psychologistId === user?.id)
                    : [];
                setSessions(mySessions);

                // Extract unique patients
                const uniquePatients = new Map();
                mySessions.forEach((s: any) => {
                    if (s.patient && s.patientId) {
                        uniquePatients.set(s.patientId, s.patient);
                    }
                });
                setPatients(Array.from(uniquePatients.values()));
            } catch (e) {
                console.warn('Sessions fetch failed');
                setSessions([]);
                setPatients([]);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading your dashboard...</div>;

    const completedSessions = sessions.filter(s => ['COMPLETED', 'SCHEDULED', 'LIVE'].includes(s.status));
    const totalEarnings = completedSessions.reduce((sum, s) => sum + ((s.price || 0) * 0.9), 0);

    // Calculate this month's earnings
    const now = new Date();
    const thisMonthSessions = completedSessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
    });
    const thisMonthEarnings = thisMonthSessions.reduce((sum, s) => sum + ((s.price || 0) * 0.9), 0);

    // Today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= today && sessionDate < tomorrow;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Generate earnings chart data (last 7 days)
    const earningsData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const dayEarnings = completedSessions
            .filter(s => new Date(s.startTime).toDateString() === date.toDateString())
            .reduce((sum, s) => sum + ((s.price || 0) * 0.9), 0);

        return {
            date: dateStr,
            earnings: dayEarnings,
        };
    });

    // New patients this month
    const newPatientsThisMonth = sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.getMonth() === now.getMonth() &&
            sessionDate.getFullYear() === now.getFullYear() &&
            s.patientId;
    }).length;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text">Welcome back, Dr. {user?.alias}!</h1>
                <p className="text-textMuted mt-1">Here's an overview of your practice</p>
            </div>

            {/* Online Status */}
            <StatusSelector />

            {/* Pending Requests */}
            <SessionRequests />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<DollarSign size={24} />}
                    label="Total Earnings"
                    value={`$${totalEarnings.toFixed(2)}`}
                    trend="All time"
                    color="bg-green-500/10 text-green-600"
                    onClick={() => navigate('/wallet')}
                />
                <StatCard
                    icon={<TrendingUp size={24} />}
                    label="This Month"
                    value={`$${thisMonthEarnings.toFixed(2)}`}
                    trend={`${thisMonthSessions.length} sessions`}
                    color="bg-blue-500/10 text-blue-600"
                />
                <StatCard
                    icon={<Users size={24} />}
                    label="Total Patients"
                    value={patients.length}
                    trend={`${newPatientsThisMonth} new this month`}
                    color="bg-purple-500/10 text-purple-600"
                />
                <StatCard
                    icon={<Wallet size={24} />}
                    label="Wallet Balance"
                    value={`$${wallet?.balance?.toFixed(2) || '0.00'}`}
                    trend="Available to withdraw"
                    color="bg-orange-500/10 text-orange-600"
                    onClick={() => navigate('/wallet')}
                />
            </div>

            {/* Charts and Schedule Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Earnings Trend Chart */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-bold text-text mb-4">Earnings Trend (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={earningsData}>
                            <defs>
                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Earnings']}
                            />
                            <Area type="monotone" dataKey="earnings" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Today's Schedule Widget */}
                <div className="bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-bold text-text mb-4">Today's Schedule</h3>
                    {todaySessions.length > 0 ? (
                        <div className="space-y-3">
                            {todaySessions.slice(0, 4).map((session: any) => (
                                <div key={session.id} className="p-3 bg-background rounded-lg border border-border">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-sm text-text">
                                            {session.patient?.alias || 'Patient'}
                                        </p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${session.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' :
                                            session.status === 'LIVE' ? 'bg-blue-500/10 text-blue-600' :
                                                'bg-orange-500/10 text-orange-600'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-textMuted">
                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            ))}
                            {todaySessions.length > 4 && (
                                <button className="w-full text-sm text-primary hover:underline">
                                    View All ({todaySessions.length})
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="mx-auto mb-2 text-textMuted opacity-50" size={32} />
                            <p className="text-sm text-textMuted">No sessions scheduled for today</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Session Stats and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session Statistics */}
                <div className="bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-bold text-text mb-4">Session Statistics</h3>
                    <div className="space-y-4">
                        <StatRow label="Total Sessions" value={sessions.length} />
                        <StatRow label="Completed" value={completedSessions.length} color="text-green-600" />
                        <StatRow label="Scheduled" value={sessions.filter(s => s.status === 'SCHEDULED').length} color="text-blue-600" />
                        <StatRow label="Cancelled" value={sessions.filter(s => s.status === 'CANCELLED').length} color="text-red-600" />
                        <div className="pt-3 border-t border-border">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-text">Completion Rate</span>
                                <span className="text-lg font-bold text-primary">
                                    {sessions.length > 0 ? ((completedSessions.length / sessions.length) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-bold text-text mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <QuickAction
                            icon={<Calendar size={20} />}
                            title="View Schedule"
                            description="See all your upcoming appointments"
                            onClick={() => navigate('/sessions')}
                        />
                        <QuickAction
                            icon={<Users size={20} />}
                            title="Manage Patients"
                            description="View your patient list and history"
                            onClick={() => navigate('/my-patients')}
                        />
                        <QuickAction
                            icon={<DollarSign size={20} />}
                            title="Request Withdrawal"
                            description="Withdraw your earnings"
                            onClick={() => navigate('/withdraw-funds')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, trend, color, onClick }: any) => (
    <div
        className={`bg-surface p-6 rounded-xl border border-border hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
        </div>
        <p className="text-textMuted text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-text my-1">{value}</p>
        <p className="text-xs text-textMuted">{trend}</p>
    </div>
);

const StatRow = ({ label, value, color = 'text-text' }: any) => (
    <div className="flex justify-between items-center">
        <span className="text-sm text-textMuted">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
);

const QuickAction = ({ icon, title, description, onClick }: any) => (
    <div
        onClick={onClick}
        className="p-4 bg-background rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer group"
    >
        <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                {icon}
            </div>
            <div>
                <p className="font-semibold text-sm text-text">{title}</p>
                <p className="text-xs text-textMuted mt-0.5">{description}</p>
            </div>
        </div>
    </div>
);

export default PsychologistDashboard;
