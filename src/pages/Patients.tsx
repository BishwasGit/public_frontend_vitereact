import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import client from '../api/client';

const Patients = () => {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const response = await client.get('/users');
            // Handle paginated response: response.data = { data: [...], meta: {...} }
            const users = Array.isArray(response.data) ? response.data : response.data.data;
            const patientUsers = users.filter((u: any) => u.role === 'PATIENT');
            setPatients(patientUsers);
        } catch (error) {
            console.error('Failed to load patients', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-textMuted">Loading patients...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text flex items-center gap-2">
                    <Users size={32} className="text-primary" />
                    Patient Management
                </h1>
                <p className="text-textMuted mt-2">View and manage all registered patients</p>
            </header>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="text-left p-4 text-textMuted font-semibold">Alias</th>
                                <th className="text-left p-4 text-textMuted font-semibold">Email</th>
                                <th className="text-left p-4 text-textMuted font-semibold">Phone</th>
                                <th className="text-left p-4 text-textMuted font-semibold">Status</th>
                                <th className="text-left p-4 text-textMuted font-semibold">Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-textMuted">
                                        No patients found
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="border-b border-border hover:bg-background/50 transition-colors">
                                        <td className="p-4 font-medium text-text">{patient.alias}</td>
                                        <td className="p-4 text-textMuted">{patient.email || 'N/A'}</td>
                                        <td className="p-4 text-textMuted">{patient.phoneNumber || 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${patient.isOnline
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {patient.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-textMuted text-sm">
                                            {new Date(patient.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4 text-sm text-textMuted">
                Total Patients: <span className="font-bold text-text">{patients.length}</span>
            </div>
        </div>
    );
};

export default Patients;
