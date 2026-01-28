import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Edit, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';
import { UserFormModal } from '../components/UserFormModal';

interface User {
    id: string;
    alias: string;
    role: 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN';
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    isVerified: boolean;
    isOnline: boolean;
    createdAt: string;
    deletedAt?: string;
    specialties?: string[];
}

type TabType = '' | 'PSYCHOLOGIST' | 'PATIENT';

const tabs: { key: TabType; label: string }[] = [
    { key: '', label: 'All Users' },
    { key: 'PSYCHOLOGIST', label: 'Psychologists' },
    { key: 'PATIENT', label: 'Patients' },
];

const Users = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tabCounts, setTabCounts] = useState<Record<string, number | null>>({
        '': null,
        'PSYCHOLOGIST': null,
        'PATIENT': null,
    });

    // Derive activeTab from URL params (single source of truth)
    const activeTab = (searchParams.get('role') as TabType) || '';

    const loadTabCounts = async () => {
        try {
            const [allRes, psychRes, patientRes] = await Promise.all([
                client.get('/users'),
                client.get('/users?role=PSYCHOLOGIST'),
                client.get('/users?role=PATIENT'),
            ]);
            const newCounts = {
                '': allRes.data.data?.length ?? 0,
                'PSYCHOLOGIST': psychRes.data.data?.length ?? 0,
                'PATIENT': patientRes.data.data?.length ?? 0,
            };
            setTabCounts(newCounts);
        } catch (error) {
            console.error('Failed to load tab counts:', error);
            // Set to 0 on error so UI doesn't show null
            setTabCounts({ '': 0, 'PSYCHOLOGIST': 0, 'PATIENT': 0 });
        }
    };

    const loadUsers = async (role: TabType) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (role) params.append('role', role);

            const url = params.toString() ? `/users?${params.toString()}` : '/users';
            const res = await client.get(url);
            setUsers(res.data.data || []);
            // Update current tab count dynamically from API response
            setTabCounts(prev => ({ ...prev, [role]: res.data.data?.length ?? 0 }));
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load users when tab changes
    useEffect(() => {
        loadUsers(activeTab);
    }, [activeTab]);

    // Load tab counts on mount
    useEffect(() => {
        loadTabCounts();
    }, []);

    const handleTabChange = (tab: TabType) => {
        if (tab) {
            setSearchParams({ role: tab });
        } else {
            setSearchParams({});
        }
    };

    const handleDelete = async () => {
        if (!deleteUserId) return;

        try {
            await client.delete(`/users/${deleteUserId}`);
            toast.success('User deleted successfully');
            setDeleteUserId(null);
            loadUsers(activeTab);
            loadTabCounts();
        } catch (error) {
            console.error('Failed to delete user:', error);
            toast.error('Failed to delete user');
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await client.patch(`/users/${id}/restore`);
            toast.success('User restored successfully');
            loadUsers(activeTab);
            loadTabCounts();
        } catch (error) {
            console.error('Failed to restore user:', error);
            toast.error('Failed to restore user');
        }
    };

    const handleVerify = async (id: string, status: boolean) => {
        try {
            await client.patch(`/users/${id}/verify`, { isVerified: status });
            toast.success(`User ${status ? 'verified' : 'unverified'} successfully`);
            loadUsers(activeTab);
        } catch (error) {
            console.error('Failed to update verification:', error);
            toast.error('Failed to update verification status');
        }
    };

    const filteredUsers = users.filter(user =>
        user.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-text">User Management</h2>
                   <p className="text-textMuted text-sm">Manage platform users and roles</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors"
                >
                    <Plus size={20} />
                    Create User
                </button>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-border">
                <div className="flex gap-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`px-6 py-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? 'text-primary'
                                    : 'text-textMuted hover:text-text'
                            }`}
                        >
                            {tab.label}
                            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full ${
                                activeTab === tab.key
                                    ? 'bg-primary text-white'
                                    : 'bg-border text-textMuted'
                            }`}>
                                {tabCounts[tab.key] === null ? '...' : tabCounts[tab.key]}
                            </span>
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
                    <input
                        type="text"
                        placeholder="Search by alias or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-textMuted">
                        <tr>
                            <th className="p-4">Alias</th>
                            <th className="p-4">Email</th>
                            {activeTab !== 'PSYCHOLOGIST' && activeTab !== 'PATIENT' && (
                                <th className="p-4">Role</th>
                            )}
                            {activeTab === 'PSYCHOLOGIST' && (
                                <th className="p-4">Specialties</th>
                            )}
                            <th className="p-4">Status</th>
                            <th className="p-4">Verified</th>
                            <th className="p-4">Created</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-textMuted">
                                    Loading...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-textMuted">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="border-t border-border hover:bg-white/5">
                                    <td className="p-4 font-medium text-text">{user.alias}</td>
                                    <td className="p-4 text-textMuted">{user.email || '-'}</td>
                                    {activeTab !== 'PSYCHOLOGIST' && activeTab !== 'PATIENT' && (
                                        <td className="p-4">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-red-900/50 text-red-200' :
                                                    user.role === 'PSYCHOLOGIST' ? 'bg-blue-900/50 text-blue-200' :
                                                        'bg-green-900/50 text-green-200'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                    )}
                                    {activeTab === 'PSYCHOLOGIST' && (
                                        <td className="p-4 text-textMuted text-sm max-w-[200px] truncate">
                                            {user.specialties?.join(', ') || '-'}
                                        </td>
                                    )}
                                    <td className="p-4">
                                        {user.deletedAt ? (
                                            <span className="text-red-400">Deleted</span>
                                        ) : user.isOnline ? (
                                            <span className="text-green-400">Online</span>
                                        ) : (
                                            <span className="text-textMuted">Offline</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {user.isVerified ? (
                                            <span className="inline-flex items-center rounded-full bg-green-900/50 px-2 py-1 text-xs font-medium text-green-200">
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-yellow-900/50 px-2 py-1 text-xs font-medium text-yellow-200">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-textMuted">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {user.deletedAt ? (
                                                <button
                                                    onClick={() => handleRestore(user.id)}
                                                    className="rounded bg-green-600 p-2 text-white hover:bg-green-700"
                                                    title="Restore User"
                                                >
                                                    <RefreshCw size={16} />
                                                </button>
                                            ) : (
                                                <>
                                                    {/* Verify/Unverify for Psychologists */}
                                                    {user.role === 'PSYCHOLOGIST' && !user.isVerified && (
                                                        <button
                                                            onClick={() => handleVerify(user.id, true)}
                                                            className="rounded bg-green-600 p-2 text-white hover:bg-green-700"
                                                            title="Verify Psychologist"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    {user.role === 'PSYCHOLOGIST' && user.isVerified && (
                                                        <button
                                                            onClick={() => handleVerify(user.id, false)}
                                                            className="rounded bg-yellow-600 p-2 text-white hover:bg-yellow-700"
                                                            title="Revoke Verification"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setEditingUser(user)}
                                                        className="rounded bg-blue-600 p-2 text-white hover:bg-blue-700"
                                                        title="Edit User"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteUserId(user.id)}
                                                        className="rounded bg-red-600 p-2 text-white hover:bg-red-700"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            <UserFormModal
                open={showCreateModal || !!editingUser}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowCreateModal(false);
                        setEditingUser(null);
                    }
                }}
                user={editingUser}
                onSuccess={() => {
                    loadUsers(activeTab);
                    loadTabCounts();
                }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUserId(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Users;
