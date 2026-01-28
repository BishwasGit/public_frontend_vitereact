import { Activity, Calendar as CalendarIcon, CheckCircle, Clock, DollarSign, ShieldAlert, TrendingUp, User, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import client from '../api/client';
import { useAuth } from '../auth/useAuth';

// Color Palette
const COLORS = ['#C9A24D', '#0F172A', '#64748B', '#10B981', '#EF4444']; // Gold, Navy, Slate, Green, Red

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState({ users: 0, revenue: 0, sessions: 0 });
    const [sessionStats, setSessionStats] = useState({ active: 0, completed: 0, cancelled: 0 });
    const [userCounts, setUserCounts] = useState({ psychologists: 0, patients: 0 });
    
    const [graphData, setGraphData] = useState<any[]>([]);
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [retention, setRetention] = useState<any[]>([
        { name: 'One-Time', value: 0, percentage: 0 },
        { name: 'Returning', value: 0, percentage: 0 },
        { name: 'Loyal', value: 0, percentage: 0 }
    ]);
    const [supplyDemand, setSupplyDemand] = useState<any[]>([]);
    const [platformHealth, setPlatformHealth] = useState<any[]>([]);
    const [pendingPsychologists, setPendingPsychologists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setError(null);
            
            // 1. Fetch Summary
            try {
                const sumRes = await client.get('/analytics/summary');
                setSummary(sumRes.data.data || sumRes.data || { users: 0, revenue: 0, sessions: 0 });
            } catch (e) {
                console.warn('Summary failed');
            }

            // 2. Fetch All Sessions for Report
            try {
                const sessRes = await client.get('/sessions');
                const sessions = sessRes.data.data || sessRes.data || [];
                if (Array.isArray(sessions)) {
                    setSessionStats({
                        active: sessions.filter((s: any) => s.status === 'LIVE' || s.status === 'UPCOMING').length, // Consider Upcoming as active for report? Or stricly LIVE. User asked 'active seeions', likely live. 'UPCOMING' is scheduled. I'll stick to Live or Upcoming as 'Active' in broad sense? No, 'Live Now' implies LIVE. 'Active' usually means not completed/cancelled. I'll count LIVE and matched.
                        completed: sessions.filter((s: any) => s.status === 'COMPLETED').length,
                        cancelled: sessions.filter((s: any) => s.status === 'CANCELLED').length
                    });
                }
            } catch (e) {
                console.warn('Session stats failed');
            }

            // 3. Fetch Users for Counts & Pending
            try {
                const usersRes = await client.get('/users');
                const users = usersRes.data.data || usersRes.data || [];
                if (Array.isArray(users)) {
                    const psychs = users.filter((u: any) => u.role === 'PSYCHOLOGIST');
                    const patients = users.filter((u: any) => u.role === 'PATIENT');
                    
                    setUserCounts({
                        psychologists: psychs.length,
                        patients: patients.length
                    });

                    setPendingPsychologists(psychs.filter((u: any) => !u.isVerified));
                }
            } catch (e) {
                console.warn('Users fetch failed');
            }

            // 4. Fetch Graph Data
             try {
                const graphRes = await client.get('/analytics/activity-graph');
                setGraphData(graphRes.data.data || graphRes.data || []);
            } catch (e) { setGraphData([]); }

             // 5. Fetch Top Users
            try {
                const perfRes = await client.get('/analytics/user-performance');
                setTopUsers(perfRes.data.data || perfRes.data || []);
            } catch (e) { setTopUsers([]); }
            
             // 6. Retention & Supply/Demand (Keeping simplified or existing if available, else defaults)
             // ... defaults initialized in state

        } catch (err: any) {
            console.error("Failed to load dashboard data", err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string) => {
        try {
            await client.patch(`/users/${id}/verify`, { isVerified: true });
            setPendingPsychologists(prev => prev.filter(p => p.id !== id));
            alert('Psychologist Verified!');
        } catch (error) {
            alert('Failed to verify');
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading Analytics...</div>;

    // Calculations
    const avgRevPerPatient = userCounts.patients > 0 ? (summary.revenue / userCounts.patients).toFixed(2) : '0.00';
    const avgRevPerPsych = userCounts.psychologists > 0 ? (summary.revenue / userCounts.psychologists).toFixed(2) : '0.00';

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-text">Dashboard</h1>
                    <p className="text-textMuted mt-1">Real-time Platform Insights</p>
                </div>
            </header>

            {/* 1. Key Metrics (Interactive) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => navigate('/user-breakdown')} className="cursor-pointer transition-transform hover:scale-[1.02]">
                    <StatCard 
                        icon={<Users size={24} />} 
                        iconBg="bg-blue-100 text-blue-600" 
                        label="Total Users" 
                        value={summary.users} 
                        sub="Tap for Breakdown" 
                    />
                </div>
                <div className="cursor-default">
                    <StatCard 
                        icon={<Activity size={24} />} 
                        iconBg="bg-purple-100 text-purple-600" 
                        label="Total Sessions" 
                        value={summary.sessions} 
                        sub="Lifetime Count" 
                    />
                </div>
                <div onClick={() => navigate('/financials')} className="cursor-pointer transition-transform hover:scale-[1.02]">
                    <StatCard 
                        icon={<DollarSign size={24} />} 
                        iconBg="bg-green-100 text-green-600" 
                        label="Total Revenue" 
                        value={`$${summary.revenue.toLocaleString()}`} 
                        sub="Tap for Financials" 
                    />
                </div>
            </div>

            {/* 2. Session Report */}
            <div>
                <h2 className="text-xl font-bold text-text mb-4">Session Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        icon={<Clock size={24} />} 
                        iconBg="bg-orange-100 text-orange-600" 
                        label="Active Sessions" 
                        value={sessionStats.active} 
                        sub="Live / Upcoming" 
                    />
                    <StatCard 
                        icon={<CheckCircle size={24} />} 
                        iconBg="bg-emerald-100 text-emerald-600" 
                        label="Completed Sessions" 
                        value={sessionStats.completed} 
                        sub="Finished Successfully" 
                    />
                    <StatCard 
                        icon={<XCircle size={24} />} 
                        iconBg="bg-red-100 text-red-600" 
                        label="Cancelled Sessions" 
                        value={sessionStats.cancelled} 
                        sub="Cancelled / No-show" 
                    />
                </div>
            </div>

            {/* 3. Revenue Insights */}
            <div>
                <h2 className="text-xl font-bold text-text mb-4">Revenue Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard 
                        icon={<User size={24} />} 
                        iconBg="bg-indigo-100 text-indigo-600" 
                        label="Avg. Revenue per Patient" 
                        value={`$${avgRevPerPatient}`} 
                        sub={`Across ${userCounts.patients} Patients`} 
                    />
                    <StatCard 
                        icon={<TrendingUp size={24} />} 
                        iconBg="bg-teal-100 text-teal-600" 
                        label="Avg. Revenue per Psychologist" 
                        value={`$${avgRevPerPsych}`} 
                        sub={`Across ${userCounts.psychologists} Psychologists`} 
                    />
                </div>
            </div>

            {/* 4. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-text">Activity Trends</h3>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                                <YAxis stroke="#64748B" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }} />
                                <Line type="monotone" dataKey="sessions" stroke="#C9A24D" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
                    <h3 className="font-bold text-lg mb-4 text-text">Top Psychologists</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                        {topUsers.length === 0 ? <p className="text-sm text-textMuted">No data available.</p> :
                            topUsers.map((user: any, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-text text-sm">{user.alias}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-green-600">${user.revenue}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* 5. Quick Actions (Hidden for Admin) */}
            {user?.role !== 'ADMIN' && (
                <div className="bg-surface rounded-xl border border-border p-6">
                    <h3 className="text-lg font-bold text-text mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => navigate('/schedule')} className="cursor-pointer p-4 bg-background border border-border rounded-lg hover:border-primary/50 flex flex-col items-center justify-center text-center gap-2 transition-colors">
                            <CalendarIcon className="w-6 h-6 text-purple-500" />
                            <span className="text-sm font-medium">Book Session</span>
                        </div>
                        <div onClick={() => navigate('/wallet')} className="cursor-pointer p-4 bg-background border border-border rounded-lg hover:border-primary/50 flex flex-col items-center justify-center text-center gap-2 transition-colors">
                            <DollarSign className="w-6 h-6 text-green-500" />
                            <span className="text-sm font-medium">Add Funds</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Verify Queue */}
            {pendingPsychologists.length > 0 && user?.role === 'ADMIN' && (
                <div className="bg-surface border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldAlert className="text-yellow-600" size={24} />
                        <h2 className="text-lg font-bold text-text">Pending Verifications</h2>
                    </div>
                    <div className="space-y-3">
                        {pendingPsychologists.map((psych: any) => (
                            <div key={psych.id} className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                                <div>
                                    <p className="font-semibold text-text">{psych.alias}</p>
                                    <p className="text-sm text-textMuted">{psych.email}</p>
                                </div>
                                <button
                                    onClick={() => handleVerify(psych.id)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                                >
                                    Verify
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable Stat Card component
const StatCard = ({ icon, iconBg, label, value, sub }: any) => (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex items-start gap-4 h-full">
        <div className={`p-3 rounded-lg ${iconBg}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-textMuted">{label}</p>
            <h3 className="text-2xl font-bold text-text mt-1">{value}</h3>
            <p className="text-xs text-textMuted mt-1">{sub}</p>
        </div>
    </div>
);

export default Dashboard;
