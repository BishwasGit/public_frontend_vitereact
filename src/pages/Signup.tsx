import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const Signup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        alias: '',
        email: '',
        pin: '',
        confirmPin: '',
        role: 'PATIENT',
        dateOfBirth: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.alias || !formData.email || !formData.pin || !formData.dateOfBirth) {
            setError('All fields are required');
            return;
        }

        if (formData.pin !== formData.confirmPin) {
            setError('PINs do not match');
            return;
        }

        if (formData.pin.length !== 4) {
            setError('PIN must be 4 digits');
            return;
        }

        try {
            setLoading(true);
            await client.post('/auth/signup', {
                alias: formData.alias,
                email: formData.email,
                pin: formData.pin,
                role: formData.role,
                dateOfBirth: formData.dateOfBirth,
            });

            alert('Signup successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8">
                <h1 className="mb-6 text-center text-3xl font-bold text-text">Create Account</h1>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-900/50 p-3 text-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-textMuted">Username</label>
                        <input
                            type="text"
                            value={formData.alias}
                            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-textMuted">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter email"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-textMuted">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="PATIENT">Patient</option>
                            <option value="PSYCHOLOGIST">Psychologist</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-textMuted">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-textMuted">PIN (4 digits)</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={formData.pin}
                            onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter 4-digit PIN"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm text-textMuted">Confirm PIN</label>
                        <input
                            type="password"
                            maxLength={4}
                            value={formData.confirmPin}
                            onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '') })}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Confirm 4-digit PIN"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-textMuted">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-primary hover:underline"
                    >
                        Login
                    </button>
                </p>

                <div className="mt-6 rounded-lg bg-blue-900/20 p-4">
                    <p className="mb-2 text-sm font-medium text-blue-200">Test Credentials:</p>
                    <div className="space-y-1 text-xs text-blue-300">
                        <p>• admin1 / 1234</p>
                        <p>• patient1 / 1234</p>
                        <p>• psychologist1 / 1234</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
