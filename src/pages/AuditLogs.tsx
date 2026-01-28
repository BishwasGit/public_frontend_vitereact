import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client';

interface AuditLog {
    id: string;
    user?: {
        id: string;
        alias: string;
        role: string;
    };
    action: string;
    entity: string;
    entityId: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

const AuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        entity: '',
        action: '',
        userId: '',
        startDate: '',
        endDate: '',
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (filters.entity) params.append('entity', filters.entity);
            if (filters.action) params.append('action', filters.action);
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const queryString = params.toString();
            const res = await client.get(`/audit-logs${queryString ? '?' + queryString : ''}`);
            setLogs(res.data.data || []);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [filters]);

    const handleExportCSV = () => {
        const csvContent = [
            ['Date', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address'].join(','),
            ...logs.map(log => [
                new Date(log.createdAt).toISOString(),
                log.user?.alias || 'System',
                log.action,
                log.entity,
                log.entityId,
                log.ipAddress || '-',
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-text">Audit Logs</h2>
                <button
                    onClick={handleExportCSV}
                    disabled={logs.length === 0}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={20} />
                    Export CSV
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                    value={filters.entity}
                    onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">All Entities</option>
                    <option value="USER">User</option>
                    <option value="SESSION">Session</option>
                    <option value="TRANSACTION">Transaction</option>
                    <option value="WALLET">Wallet</option>
                    <option value="SERVICE_OPTION">Service Option</option>
                    <option value="DISPUTE">Dispute</option>
                    <option value="MEDIA_FOLDER">Media Folder</option>
                    <option value="MEDIA_FILE">Media File</option>
                    <option value="PROFILE">Profile</option>
                </select>

                <select
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="READ">Read</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                    <option value="VERIFY">Verify</option>
                    <option value="APPROVE">Approve</option>
                    <option value="REJECT">Reject</option>
                    <option value="REFUND">Refund</option>
                    <option value="SETTLE">Settle</option>
                </select>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Start Date"
                />

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="End Date"
                />

                <button
                    onClick={() => setFilters({ entity: '', action: '', userId: '', startDate: '', endDate: '' })}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-text hover:bg-white/5"
                >
                    Clear Filters
                </button>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-textMuted">
                        <tr>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">User</th>
                            <th className="p-4">Action</th>
                            <th className="p-4">Entity</th>
                            <th className="p-4">Entity ID</th>
                            <th className="p-4">IP Address</th>
                            <th className="p-4">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-textMuted">
                                    Loading...
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-textMuted">
                                    No audit logs found
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id} className="border-t border-border hover:bg-white/5">
                                    <td className="p-4 text-textMuted">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-text">
                                                {log.user?.alias || 'System'}
                                            </span>
                                            {log.user && (
                                                <span className="text-xs text-textMuted">{log.user.role}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${log.action === 'CREATE' ? 'bg-green-900/50 text-green-200' :
                                                log.action === 'UPDATE' ? 'bg-blue-900/50 text-blue-200' :
                                                    log.action === 'DELETE' ? 'bg-red-900/50 text-red-200' :
                                                        log.action === 'LOGIN' ? 'bg-purple-900/50 text-purple-200' :
                                                            'bg-gray-900/50 text-gray-200'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-text">{log.entity}</td>
                                    <td className="p-4 font-mono text-xs text-textMuted">
                                        {log.entityId.substring(0, 8)}...
                                    </td>
                                    <td className="p-4 text-textMuted">{log.ipAddress || '-'}</td>
                                    <td className="p-4">
                                        {log.changes && (
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-primary hover:underline"
                                            >
                                                View Changes
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Changes Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-lg bg-surface p-6 border border-border max-h-[80vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-text">Audit Log Details</h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-textMuted hover:text-text"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-textMuted mb-1">Action</p>
                                    <p className="text-text font-medium">{selectedLog.action}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted mb-1">Entity</p>
                                    <p className="text-text font-medium">{selectedLog.entity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted mb-1">User</p>
                                    <p className="text-text font-medium">{selectedLog.user?.alias || 'System'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted mb-1">Date & Time</p>
                                    <p className="text-text font-medium">
                                        {new Date(selectedLog.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted mb-1">IP Address</p>
                                    <p className="text-text font-mono text-sm">{selectedLog.ipAddress || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-textMuted mb-1">Entity ID</p>
                                    <p className="text-text font-mono text-sm">{selectedLog.entityId}</p>
                                </div>
                            </div>

                            {selectedLog.changes && (
                                <div>
                                    <p className="text-sm text-textMuted mb-2">Changes</p>
                                    <pre className="bg-background/50 rounded-lg p-4 text-sm text-text overflow-x-auto border border-border">
                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.userAgent && (
                                <div>
                                    <p className="text-sm text-textMuted mb-1">User Agent</p>
                                    <p className="text-text text-sm break-all">{selectedLog.userAgent}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedLog(null)}
                            className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
