import { createContext } from 'react';

export type User = {
    id: string;
    alias: string;
    role: 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN';
    sessionTimeout?: number;
};

export type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    login: (alias: string, pin: string) => Promise<void>;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
