import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { ArrowRight, Calendar, CreditCard, MessageSquare, Search, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [wallet, setWallet] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
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
                const userSessions = Array.isArray(sessionsData)
                    ? sessionsData.filter((s: any) => s.patientId === user?.id)
                    : [];
                setSessions(userSessions);
            } catch (e) {
                console.warn('Sessions fetch failed');
                setSessions([]);
            }

            // Fetch messages/conversations
            try {
                const messagesRes = await client.get('/messages/conversations');
                setMessages(messagesRes.data.data || messagesRes.data || []);
            } catch (e) {
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading your dashboard...</div>;

    const upcomingSessions = sessions.filter(s => s.status === 'SCHEDULED' && new Date(s.startTime) > new Date());
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
    const unreadMessages = messages.filter((m: any) => m.lastMessage && !m.lastMessage.isRead).length;

    // Generate activity chart data (last 7 days)
    const activityData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const daySessions = sessions.filter(s => {
            const sessionDate = new Date(s.startTime);
            return sessionDate.toDateString() === date.toDateString() && s.status === 'COMPLETED';
        });

        return {
            date: dateStr,
            sessions: daySessions.length,
        };
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-text">Welcome back, {user?.alias}!</h1>
                <p className="text-textMuted mt-1">Here's what's happening with your mental health journey</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Wallet size={24} />}
                    label="Wallet Balance"
                    value={`$${wallet?.balance?.toFixed(2) || '0.00'}`}
                    trend="+12% from last month"
                    color="bg-green-500/10 text-green-600"
                    onClick={() => navigate('/wallet')}
                />
                <StatCard
                    icon={<Calendar size={24} />}
                    label="Upcoming Sessions"
                    value={upcomingSessions.length}
                    trend={`${completedSessions.length} completed`}
                    color="bg-blue-500/10 text-blue-600"
                    onClick={() => navigate('/sessions')}
                />
                <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Total Sessions"
                    value={sessions.length}
                    trend="All time"
                    color="bg-purple-500/10 text-purple-600"
                />
                <StatCard
                    icon={<MessageSquare size={24} />}
                    label="Unread Messages"
                    value={unreadMessages}
                    trend={`${messages.length} conversations`}
                    color="bg-orange-500/10 text-orange-600"
                    onClick={() => navigate('/messages')}
                />
            </div>

            {/* Charts and Widgets Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Session Activity Chart */}
                <div className="lg:col-span-2 bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-bold text-text mb-4">Session Activity (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={activityData}>
                            <defs>
                                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C9A24D" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#C9A24D" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="sessions" stroke="#C9A24D" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Next Session Widget */}
                <div className="bg-surface p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-bold text-text mb-4">Next Session</h3>
                    {upcomingSessions.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingSessions.slice(0, 2).map((session: any) => (
                                <div key={session.id} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                    <p className="font-semibold text-text text-sm">
                                        {session.psychologist?.alias || 'Psychologist'}
                                    </p>
                                    <p className="text-xs text-textMuted mt-1">
                                        {new Date(session.startTime).toLocaleDateString()} at{' '}
                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-primary font-semibold">${session.price}</span>
                                        <button className="text-xs text-primary hover:underline">View Details</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="mx-auto mb-2 text-textMuted opacity-50" size={32} />
                            <p className="text-sm text-textMuted">No upcoming sessions</p>
                            <button
                                onClick={() => navigate('/find-psychologist')}
                                className="mt-3 text-sm text-primary hover:underline"
                            >
                                Find a psychologist
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface p-6 rounded-xl border border-border">
                <h3 className="text-lg font-bold text-text mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <QuickAction
                        icon={<Search size={20} />}
                        title="Find Psychologist"
                        description="Browse verified mental health professionals"
                        onClick={() => navigate('/find-psychologist')}
                    />
                    <QuickAction
                        icon={<CreditCard size={20} />}
                        title="Add Funds"
                        description="Top up your wallet balance"
                        onClick={() => navigate('/add-funds')}
                    />
                    <QuickAction
                        icon={<Calendar size={20} />}
                        title="My Sessions"
                        description="View and manage your appointments"
                        onClick={() => navigate('/sessions')}
                    />
                </div>
            </div>

            {/* Recent Messages Preview */}
            {messages.length > 0 && (
                <div className="bg-surface p-6 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text">Recent Messages</h3>
                        <button
                            onClick={() => navigate('/messages')}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            View All <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {messages.slice(0, 3).map((conv: any) => (
                            <div key={conv.user.id} className="flex items-center gap-3 p-3 bg-background rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {conv.user.alias.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-text">{conv.user.alias}</p>
                                    <p className="text-xs text-textMuted truncate">
                                        {conv.lastMessage?.content || 'No messages yet'}
                                    </p>
                                </div>
                                {!conv.lastMessage?.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, trend, color, onClick }: any) => (
    <div
        className={`bg-surface p-6 rounded-xl border border-border hover:shadow-lg transition-all cursor-pointer ${onClick ? '' : 'cursor-default'}`}
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

export default PatientDashboard;
