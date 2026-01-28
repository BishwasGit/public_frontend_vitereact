import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Psychologists() {
    const [psychologists, setPsychologists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch all users (backend doesn't support role filtering via query params)
            const response = await client.get('/users');
            // Handle paginated response
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            // Filter for psychologists only
            const psychs = users.filter((u: any) => u.role === 'PSYCHOLOGIST');
            setPsychologists(psychs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const verifyPsychologist = async (id: string, status: boolean) => {
        try {
            await client.patch(`/users/${id}/verify`, { isVerified: status });
            fetchData(); // Refresh
        } catch (e) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h2 className="mb-6 text-2xl font-bold">Psychologist Management</h2>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-textMuted">
                        <tr>
                            <th className="p-4">Alias</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4">Specialties</th>
                            <th className="p-4">Verified</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {psychologists.map((psych) => (
                            <tr key={psych.id} className="border-t border-border hover:bg-white/5">
                                <td className="p-4 font-medium text-text">{psych.alias}</td>
                                <td className="p-4 text-textMuted">{new Date(psych.createdAt).toLocaleDateString()}</td>
                                <td className="p-4 text-textMuted text-sm">{psych.specialties?.join(', ') || '-'}</td>
                                <td className="p-4">
                                    {psych.isVerified ? (
                                        <span className="inline-flex items-center rounded-full bg-green-900/50 px-2 py-1 text-xs font-medium text-green-200">
                                            Verified
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-yellow-900/50 px-2 py-1 text-xs font-medium text-yellow-200">
                                            Pending
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {!psych.isVerified && (
                                        <button
                                            onClick={() => verifyPsychologist(psych.id, true)}
                                            className="mr-2 rounded bg-green-600 p-2 text-white hover:bg-green-700"
                                            title="Approve"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                    <button
                                        className="rounded bg-red-600 p-2 text-white hover:bg-red-700"
                                        title="Reject / Ban"
                                    >
                                        <X size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
