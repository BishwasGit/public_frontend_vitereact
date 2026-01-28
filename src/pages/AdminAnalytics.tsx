import {
    Activity,
    BarChart3,
    Clock,
    DollarSign,
    PieChart,
    RefreshCw,
    TrendingUp,
    Users,
    Wallet,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import client from '../api/client';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/ui/button';

// Color palette
const COLORS = {
    primary: '#C9A24D',
    secondary: '#0F172A',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6',
    pink: '#EC4899',
};

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

interface OverviewData {
    users: {
        total: number;
        psychologists: number;
        verifiedPsychologists: number;
        patients: number;
        active: number;
        growth: number;
    };
    sessions: {
        total: number;
        completed: number;
        live: number;
        scheduled: number;
        cancelled: number;
        growth: number;
    };
    revenue: {
        total: number;
        transactions: number;
        averageSessionPrice: number;
    };
}

interface RealtimeData {
    liveSessions: number;
    onlineUsers: number;
    onlinePsychologists: number;
    recentSignups: number;
    sessions: Array<{
        id: string;
        psychologist: string;
        patient: string;
        startTime: string;
        price: number;
    }>;
}

interface RevenueData {
    period: string;
    gross: number;
    net: number;
    platformFees: number;
    refunds: number;
    transactionCount: number;
}

interface WalletStats {
    totalBalance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    averageBalance: number;
    topWallets: Array<{
        alias: string;
        role: string;
        balance: number;
    }>;
}

const AdminAnalytics = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Data states
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [realtime, setRealtime] = useState<RealtimeData | null>(null);
    const [revenue, setRevenue] = useState<RevenueData | null>(null);
    const [revenuePeriod, setRevenuePeriod] = useState('month');
    const [userGrowth, setUserGrowth] = useState<any[]>([]);
    const [userGrowthDays, setUserGrowthDays] = useState(30);
    const [activityGraph, setActivityGraph] = useState<any[]>([]);
    const [retention, setRetention] = useState<any[]>([]);
    const [platformHealth, setPlatformHealth] = useState<any[]>([]);
    const [supplyDemand, setSupplyDemand] = useState<any[]>([]);

    const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
    const [topPerformers, setTopPerformers] = useState<any[]>([]);

    // Load all data
    const loadData = async (showRefresh = false) => {
        try {
            if (showRefresh) setRefreshing(true);
            else setLoading(true);

            const [
                overviewRes,
                realtimeRes,
                revenueRes,
                userGrowthRes,
                activityRes,
                retentionRes,
                healthRes,
                supplyRes,
                // sessionRes removed
                walletRes,
                performersRes,
            ] = await Promise.all([
                client.get('/analytics/overview').catch(() => ({ data: null })),
                client.get('/analytics/realtime').catch(() => ({ data: null })),
                client.get(`/analytics/revenue?period=${revenuePeriod}`).catch(() => ({ data: null })),
                client.get(`/analytics/user-growth?days=${userGrowthDays}`).catch(() => ({ data: [] })),
                client.get('/analytics/activity-graph?days=14').catch(() => ({ data: [] })),
                client.get('/analytics/retention').catch(() => ({ data: [] })),
                client.get('/analytics/platform-health').catch(() => ({ data: [] })),
                client.get('/analytics/supply-demand').catch(() => ({ data: [] })),
                // client.get('/analytics/sessions/stats').catch(() => ({ data: null })),
                client.get('/analytics/wallet/stats').catch(() => ({ data: null })),
                client.get('/analytics/user-performance?limit=5').catch(() => ({ data: [] })),
            ]);

            setOverview(overviewRes.data?.data || overviewRes.data);
            setRealtime(realtimeRes.data?.data || realtimeRes.data);
            setRevenue(revenueRes.data?.data || revenueRes.data);
            setUserGrowth(userGrowthRes.data?.data || userGrowthRes.data || []);
            setActivityGraph(activityRes.data?.data || activityRes.data || []);
            setRetention(retentionRes.data?.data || retentionRes.data || []);
            setPlatformHealth(healthRes.data?.data || healthRes.data || []);
            setSupplyDemand(supplyRes.data?.data || supplyRes.data || []);
            // setSessionStats(sessionRes.data?.data || sessionRes.data);
            setWalletStats(walletRes.data?.data || walletRes.data);
            setTopPerformers(performersRes.data?.data || performersRes.data || []);

            setLastUpdated(new Date());
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Reload revenue when period changes
    useEffect(() => {
        client.get(`/analytics/revenue?period=${revenuePeriod}`)
            .then(res => setRevenue(res.data?.data || res.data))
            .catch(console.error);
    }, [revenuePeriod]);

    // Reload user growth when days change
    useEffect(() => {
        client.get(`/analytics/user-growth?days=${userGrowthDays}`)
            .then(res => setUserGrowth(res.data?.data || res.data || []))
            .catch(console.error);
    }, [userGrowthDays]);

    // Auto-refresh realtime data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            client.get('/analytics/realtime')
                .then(res => {
                    setRealtime(res.data?.data || res.data);
                    setLastUpdated(new Date());
                })
                .catch(console.error);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    if (user?.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <BarChart3 size={48} className="mx-auto text-textMuted mb-4" />
                    <h2 className="text-xl font-bold text-text">Access Denied</h2>
                    <p className="text-textMuted mt-2">This page is only accessible to administrators.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-textMuted">Loading analytics data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text flex items-center gap-3">
                        <BarChart3 className="text-primary" />
                        Super-Admin Analytics
                    </h1>
                    <p className="text-textMuted mt-1">
                        Comprehensive platform insights • Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <Button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
            </header>

            {/* Section 1: Real-time Stats */}
            <section>
                <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                    <Zap className="text-yellow-500" size={20} />
                    Real-time Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Activity size={24} />}
                        iconBg="bg-green-100 text-green-600"
                        label="Live Sessions"
                        value={realtime?.liveSessions || 0}
                        sub="Active right now"
                        pulse
                    />
                    <StatCard
                        icon={<Users size={24} />}
                        iconBg="bg-blue-100 text-blue-600"
                        label="Online Users"
                        value={realtime?.onlineUsers || 0}
                        sub={`${realtime?.onlinePsychologists || 0} psychologists`}
                    />
                    <StatCard
                        icon={<TrendingUp size={24} />}
                        iconBg="bg-purple-100 text-purple-600"
                        label="New Signups (24h)"
                        value={realtime?.recentSignups || 0}
                        sub="Last 24 hours"
                    />
                    <StatCard
                        icon={<Users size={24} />}
                        iconBg="bg-orange-100 text-orange-600"
                        label="Active Users"
                        value={overview?.users.active || 0}
                        sub={`${overview?.users.growth || 0}% growth`}
                        trend={overview?.users.growth}
                    />
                </div>
            </section>

            {/* Section 2: Revenue Analytics */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-text flex items-center gap-2">
                        <DollarSign className="text-green-500" size={20} />
                        Revenue Analytics
                    </h2>
                    <div className="flex gap-2">
                        {['week', 'month', 'year'].map((period) => (
                            <Button
                                key={period}
                                size="sm"
                                variant={revenuePeriod === period ? 'default' : 'outline'}
                                onClick={() => setRevenuePeriod(period)}
                            >
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<DollarSign size={24} />}
                        iconBg="bg-green-100 text-green-600"
                        label="Gross Revenue"
                        value={`$${(revenue?.gross || 0).toLocaleString()}`}
                        sub={`${revenue?.transactionCount || 0} transactions`}
                    />
                    <StatCard
                        icon={<DollarSign size={24} />}
                        iconBg="bg-blue-100 text-blue-600"
                        label="Net Revenue"
                        value={`$${(revenue?.net || 0).toLocaleString()}`}
                        sub="After fees"
                    />
                    <StatCard
                        icon={<TrendingUp size={24} />}
                        iconBg="bg-primary/20 text-primary"
                        label="Platform Fees"
                        value={`$${(revenue?.platformFees || 0).toLocaleString()}`}
                        sub="10% commission"
                    />
                    <StatCard
                        icon={<DollarSign size={24} />}
                        iconBg="bg-red-100 text-red-600"
                        label="Refunds"
                        value={`$${(revenue?.refunds || 0).toLocaleString()}`}
                        sub="Total refunded"
                    />
                </div>
            </section>

            {/* Section 3: Charts Row */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Graph */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-text">Activity Trends (14 Days)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityGraph}>
                                <defs>
                                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                                <YAxis stroke="#64748B" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Legend />
                                <Area type="monotone" dataKey="sessions" stroke={COLORS.primary} fill="url(#colorSessions)" strokeWidth={2} name="Sessions" />
                                <Area type="monotone" dataKey="revenue" stroke={COLORS.success} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue ($)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Growth */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-text">User Growth</h3>
                        <div className="flex gap-1">
                            {[7, 30, 90].map((days) => (
                                <Button
                                    key={days}
                                    size="sm"
                                    variant={userGrowthDays === days ? 'default' : 'ghost'}
                                    onClick={() => setUserGrowthDays(days)}
                                    className="text-xs px-2"
                                >
                                    {days}d
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                                <YAxis stroke="#64748B" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Legend />
                                <Line type="monotone" dataKey="patients" stroke={COLORS.info} strokeWidth={2} name="Patients" dot={false} />
                                <Line type="monotone" dataKey="psychologists" stroke={COLORS.purple} strokeWidth={2} name="Psychologists" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Section 4: Platform Overview */}
            <section>
                <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                    <PieChart className="text-purple-500" size={20} />
                    Platform Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard
                        icon={<Users size={24} />}
                        iconBg="bg-blue-100 text-blue-600"
                        label="Total Users"
                        value={overview?.users.total || 0}
                        sub={`${overview?.users.patients || 0} patients`}
                    />
                    <StatCard
                        icon={<Users size={24} />}
                        iconBg="bg-purple-100 text-purple-600"
                        label="Psychologists"
                        value={overview?.users.psychologists || 0}
                        sub={`${overview?.users.verifiedPsychologists || 0} verified`}
                    />
                    <StatCard
                        icon={<Activity size={24} />}
                        iconBg="bg-green-100 text-green-600"
                        label="Total Sessions"
                        value={overview?.sessions.total || 0}
                        sub={`${overview?.sessions.growth || 0}% growth`}
                        trend={overview?.sessions.growth}
                    />
                    <StatCard
                        icon={<Clock size={24} />}
                        iconBg="bg-emerald-100 text-emerald-600"
                        label="Completed"
                        value={overview?.sessions.completed || 0}
                        sub="Sessions finished"
                    />
                    <StatCard
                        icon={<DollarSign size={24} />}
                        iconBg="bg-primary/20 text-primary"
                        label="Avg. Session Price"
                        value={`$${(overview?.revenue.averageSessionPrice || 0).toFixed(2)}`}
                        sub="Per session"
                    />
                </div>
            </section>

            {/* Section 5: Detailed Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient Retention */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-text">Patient Retention</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={retention}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {retention.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-center gap-4 text-xs">
                        {retention.map((item, index) => (
                            <div key={item.name} className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                                <span className="text-textMuted">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform Health */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-text">Session Status Distribution</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={platformHealth} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" stroke="#64748B" fontSize={11} />
                                <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={80} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {platformHealth.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                entry.name === 'COMPLETED' ? COLORS.success :
                                                    entry.name === 'CANCELLED' ? COLORS.danger :
                                                        entry.name === 'LIVE' ? COLORS.warning :
                                                            COLORS.info
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-text">Top Psychologists</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {topPerformers.length === 0 ? (
                            <p className="text-sm text-textMuted text-center py-4">No data available</p>
                        ) : (
                            topPerformers.map((user, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? 'bg-yellow-100 text-yellow-600' :
                                            i === 1 ? 'bg-gray-100 text-gray-600' :
                                                i === 2 ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'
                                            }`}>
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text text-sm">{user.alias}</p>
                                            <p className="text-xs text-textMuted">{user.sessions} sessions</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">${user.revenue}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Section 6: Wallet Stats */}
            <section>
                <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                    <Wallet className="text-blue-500" size={20} />
                    Wallet Statistics
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<Wallet size={24} />}
                        iconBg="bg-blue-100 text-blue-600"
                        label="Total Balance"
                        value={`$${(walletStats?.totalBalance || 0).toLocaleString()}`}
                        sub="Platform-wide"
                    />
                    <StatCard
                        icon={<TrendingUp size={24} />}
                        iconBg="bg-green-100 text-green-600"
                        label="Total Deposits"
                        value={`$${(walletStats?.totalDeposits || 0).toLocaleString()}`}
                        sub="All time"
                    />
                    <StatCard
                        icon={<DollarSign size={24} />}
                        iconBg="bg-red-100 text-red-600"
                        label="Total Withdrawals"
                        value={`$${(walletStats?.totalWithdrawals || 0).toLocaleString()}`}
                        sub="All time"
                    />
                    <StatCard
                        icon={<DollarSign size={24} />}
                        iconBg="bg-purple-100 text-purple-600"
                        label="Avg. Balance"
                        value={`$${(walletStats?.averageBalance || 0).toFixed(2)}`}
                        sub="Per wallet"
                    />
                </div>

                {/* Top Wallets */}
                {walletStats?.topWallets && walletStats.topWallets.length > 0 && (
                    <div className="mt-4 bg-surface p-6 rounded-xl border border-border">
                        <h3 className="font-bold text-lg mb-4 text-text">Top Wallet Balances</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {walletStats.topWallets.map((wallet, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wallet.role === 'PSYCHOLOGIST' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {wallet.alias.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-text text-sm truncate">{wallet.alias}</p>
                                        <p className="text-xs text-textMuted">{wallet.role}</p>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">${wallet.balance.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Section 7: Supply & Demand (Sessions by Hour) */}
            <section className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                <h2 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
                    <Clock className="text-orange-500" size={20} />
                    Session Demand by Hour
                </h2>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={supplyDemand}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="hour" stroke="#64748B" fontSize={10} interval={1} />
                            <YAxis stroke="#64748B" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                            <Bar dataKey="sessions" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Sessions" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
};

// Reusable Stat Card Component
const StatCard = ({
    icon,
    iconBg,
    label,
    value,
    sub,
    trend,
    pulse,
}: {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string | number;
    sub: string;
    trend?: number;
    pulse?: boolean;
}) => (
    <div className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-start gap-4 h-full">
        <div className={`p-3 rounded-lg ${iconBg} ${pulse ? 'animate-pulse' : ''}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-textMuted truncate">{label}</p>
            <h3 className="text-2xl font-bold text-text mt-1">{value}</h3>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-textMuted">{sub}</p>
                {trend !== undefined && trend !== 0 && (
                    <span className={`text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    </div>
);

export default AdminAnalytics;
