import { useContext } from 'react';
import { AuthContext } from './createAuthContext';

export const useAuth = () => useContext(AuthContext);
