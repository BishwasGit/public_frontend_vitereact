import { ArrowLeft, Shield, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { Button } from '../components/ui/button';

const UserBreakdown = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await client.get('/users');
                setUsers(res.data.data || res.data || []);
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const admins = users.filter((u) => u.role === 'ADMIN');
    const psychologists = users.filter((u) => u.role === 'PSYCHOLOGIST');
    const patients = users.filter((u) => u.role === 'PATIENT');

    if (loading) return <div className="p-10 text-center">Loading breakdown...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-text">User Breakdown</h1>
                    <p className="text-textMuted">Detailed distribution of platform users</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <BreakdownCard
                    title="Admins"
                    count={admins.length}
                    icon={<Shield size={24} className="text-purple-600" />}
                    bg="bg-purple-100"
                    users={admins}
                />
                <BreakdownCard
                    title="Psychologists"
                    count={psychologists.length}
                    icon={<User size={24} className="text-blue-600" />}
                    bg="bg-blue-100"
                    users={psychologists}
                />
                <BreakdownCard
                    title="Patients"
                    count={patients.length}
                    icon={<Users size={24} className="text-green-600" />}
                    bg="bg-green-100"
                    users={patients}
                />
            </div>
        </div>
    );
};

const BreakdownCard = ({ title, count, icon, bg, users }: any) => (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${bg}`}>{icon}</div>
            <span className="text-2xl font-bold text-text">{count}</span>
        </div>
        <h3 className="font-semibold text-text mb-4">{title}</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {users.length === 0 ? (
                <p className="text-sm text-textMuted">No users found.</p>
            ) : (
                users.map((u: any) => (
                    <div key={u.id} className="text-sm p-2 bg-background rounded border border-border flex justify-between">
                        <span className="font-medium truncate">{u.alias}</span>
                        <span className="text-textMuted text-xs">{u.email ? 'Email Verified' : 'No Email'}</span>
                    </div>
                ))
            )}
        </div>
    </div>
);

export default UserBreakdown;
