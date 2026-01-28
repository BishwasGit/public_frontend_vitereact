import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import client from '../api/client';
import { AuthContext, type User } from './createAuthContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const logout = useCallback(async () => {
        if (user?.role === 'PSYCHOLOGIST') {
            try {
                // Set status to AWAY on logout
                await client.patch('/profile/status', { status: 'AWAY' });
            } catch (e) {
                console.error('Failed to update status on logout', e);
            }
        }
        localStorage.removeItem('auth_token');
        setUser(null);
        window.location.href = '/login';
    }, [user]);

    useEffect(() => {
        if (!user) return;

        // Default to 30 minutes if not set
        const timeoutMinutes = user.sessionTimeout || 30;
        const timeoutMs = timeoutMinutes * 60 * 1000;
        
        let timeoutId: number;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                toast.warning('Session timed out due to inactivity');
                logout();
            }, timeoutMs);
        };

        // Events to listen for activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        
        const handleActivity = () => {
            resetTimer();
        };

        // Initial set
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user, logout]);

    const checkUser = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                const profile = await client.get('/users/me');
                setUser(profile.data.data); // Save full user data including sessionTimeout
            }
        } catch {
            localStorage.removeItem('auth_token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (alias: string, pin: string) => {
        const response = await client.post('/auth/login', { alias, pin });
        // Backend returns nested structure: {data: {access_token, user}}
        const token = response.data.data.access_token;
        localStorage.setItem('auth_token', token);

        try {
            const profile = await client.get('/users/me');
            setUser(profile.data.data); // Also fix the profile data extraction
        } catch (error) {
            localStorage.removeItem('auth_token');
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
