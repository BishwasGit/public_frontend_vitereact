
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import client from '../api/client';

interface User {
    id: string;
    alias: string;
    role: string;
    email?: string;
    phoneNumber?: string;
}

interface UserSearchProps {
    onSelect: (user: User) => void;
    placeholder?: string;
    initialValue?: string;
}

const UserSearch = ({ onSelect, placeholder = "Search for a user...", initialValue = '' }: UserSearchProps) => {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchUsers = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            try {
                setLoading(true);
                const res = await client.get(`/users?search=${encodeURIComponent(query)}&limit=5`);
                setResults(res.data.data || []);
                setIsOpen(true);
            } catch (error) {
                console.error('Failed to search users:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(searchUsers, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (user: User) => {
        onSelect(user);
        setQuery(user.alias); // Or keep it as searching text? Let's show alias.
        setIsOpen(false);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim() && setIsOpen(true)}
                    className="w-full rounded-lg border border-border bg-surface pl-10 pr-10 py-2 text-text placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={placeholder}
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-text"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {isOpen && (results.length > 0 || loading) && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg max-h-60 overflow-y-auto">
                    {loading && <div className="p-4 text-center text-textMuted">Searching...</div>}
                    {!loading && results.length === 0 && (
                        <div className="p-4 text-center text-textMuted">No users found</div>
                    )}
                    {!loading && results.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-border last:border-0"
                        >
                            <div className="font-medium text-text">{user.alias}</div>
                            <div className="text-xs text-textMuted flex gap-2">
                                <span className={`uppercase ${user.role === 'PSYCHOLOGIST' ? 'text-primary' : ''}`}>
                                    {user.role}
                                </span>
                                {user.email && <span>• {user.email}</span>}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserSearch;
