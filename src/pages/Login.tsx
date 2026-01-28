import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const Login = () => {
    const [alias, setAlias] = useState('admin1');
    const [pin, setPin] = useState('1234');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(alias, pin);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Invalid credentials');
        }
    };



    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-surface border border-border p-8 rounded-xl w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-2">Admin Portal</h1>
                    <p className="text-textMuted">Secure login for platform managers</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-2">Email / Alias</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-textMuted" />
                            <input
                                type="text"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-4 text-text focus:outline-none focus:border-primary transition-colors"
                                placeholder="ID / Email / Phone"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-2">Password / PIN</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-textMuted" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-10 text-text focus:outline-none focus:border-primary transition-colors"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-textMuted hover:text-text transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-textMuted cursor-pointer hover:text-text transition-colors">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="mr-2 rounded border-border bg-background text-primary focus:ring-primary"
                            />
                            Remember me
                        </label>
                    </div>

                    {/* Dev: Quick Fill */}
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs text-center space-y-2">
                        <p className="font-medium text-blue-800">Dev: Quick Fill</p>
                        <div className="flex justify-center gap-3 flex-wrap">
                            <button type="button" onClick={() => { setAlias('admin1'); setPin('1234'); }} className="text-primary hover:underline font-medium">Admin</button>
                            <span className="text-gray-300">|</span>
                            <button type="button" onClick={() => { setAlias('patient1'); setPin('1234'); }} className="text-primary hover:underline font-medium">Patient</button>
                            <span className="text-gray-300">|</span>
                            <button type="button" onClick={() => { setAlias('psychologist1'); setPin('1234'); }} className="text-primary hover:underline font-medium">Psycologist</button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primaryDark text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-primary/20"
                    >
                        Login to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
