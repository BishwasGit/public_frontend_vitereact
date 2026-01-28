import { EmptyState, LoadingState, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { getMediaUrl } from '@/lib/utils';
import { RefreshCw, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';

interface Psychologist {
    id: string;
    alias: string;
    bio?: string;
    specialties?: string[];
    languages?: string[];
    hourlyRate?: number;
    isVerified: boolean;
    profileImage?: string;
}

const FindPsychologist = () => {
    const navigate = useNavigate();
    const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
    const [activeTab, setActiveTab] = useState<'PSYCHOLOGISTS' | 'GROUPS'>('PSYCHOLOGISTS');
    const [groupSessions, setGroupSessions] = useState<any[]>([]);
    const [filteredPsychologists, setFilteredPsychologists] = useState<Psychologist[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');

    useEffect(() => {
        if (activeTab === 'PSYCHOLOGISTS') {
            loadPsychologists();
        } else {
            loadGroupSessions();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'PSYCHOLOGISTS') {
            filterPsychologists();
        }
    }, [searchQuery, selectedSpecialty, psychologists, activeTab]);

    const loadGroupSessions = async () => {
        try {
            setLoading(true);
            const res = await client.get('/sessions/group/all');
            const data = res.data.data || res.data;
            const sessions = Array.isArray(data) ? data : [];
            console.log('Loaded group sessions:', sessions);
            setGroupSessions(sessions);
        } catch (error: any) {
            console.error('Failed to load group sessions:', error);
            const message = error.response?.data?.message || 'Failed to load group sessions';
            toast.error(message);
            setGroupSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async (sessionId: string) => {
        try {
            await client.post(`/sessions/${sessionId}/join`);
            toast.success('Successfully joined group session');
            navigate(`/sessions/${sessionId}`);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to join session';
            toast.error(message);
        }
    };

    const loadPsychologists = async () => {
        try {
            setLoading(true);
            const res = await client.get('/profile/psychologists');
            const data = res.data.data || res.data || [];
            // Filter only verified psychologists for patients
            const verified = Array.isArray(data) ? data.filter((p: Psychologist) => p.isVerified) : [];
            setPsychologists(verified);
            setFilteredPsychologists(verified);
        } catch (error) {
            console.error('Failed to load psychologists:', error);
            toast.error('Failed to load psychologists');
            setPsychologists([]);
            setFilteredPsychologists([]);
        } finally {
            setLoading(false);
        }
    };

    const filterPsychologists = () => {
        let filtered = [...psychologists];

        // Search filter (name, bio, specialties)
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Specialty filter
        if (selectedSpecialty !== 'ALL') {
            filtered = filtered.filter(p =>
                p.specialties?.includes(selectedSpecialty)
            );
        }

        setFilteredPsychologists(filtered);
    };

    // Get unique specialties for filter
    const allSpecialties = Array.from(
        new Set(psychologists.flatMap(p => p.specialties || []))
    ).sort();

    return (
        <div>
            <PageHeader
                title="Find a Psychologist"
                description="Browse verified therapists and book your session"
                icon={<Search size={24} className="text-primary" />}
            />

            {/* Tabs */}
            <div className="flex justify-between items-center mb-6 border-b border-border">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('PSYCHOLOGISTS')}
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'PSYCHOLOGISTS'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-textMuted hover:text-text'
                            }`}
                    >
                        Psychologists
                    </button>
                    <button
                        onClick={() => setActiveTab('GROUPS')}
                        className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'GROUPS'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-textMuted hover:text-text'
                            }`}
                    >
                        Group Sessions
                    </button>
                </div>
                
                {/* Refresh button for group sessions */}
                {activeTab === 'GROUPS' && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadGroupSessions()}
                        disabled={loading}
                        className="mb-2"
                    >
                        <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                )}
            </div>

            {/* Search and Filters */}
            {activeTab === 'PSYCHOLOGISTS' && (
                <div className="mb-6 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, specialty, or expertise..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-surface text-text placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Specialty Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedSpecialty('ALL')}
                            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedSpecialty === 'ALL'
                                ? 'bg-primary text-white'
                                : 'bg-surface text-textMuted hover:bg-white/5'
                                }`}
                        >
                            All Specialties
                        </button>
                        {allSpecialties.map((specialty) => (
                            <button
                                key={specialty}
                                onClick={() => setSelectedSpecialty(specialty)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedSpecialty === specialty
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-textMuted hover:bg-white/5'
                                    }`}
                            >
                                {specialty}
                            </button>
                        ))}
                    </div>

                    {/* Results Count */}
                    <p className="text-sm text-textMuted">
                        Showing {filteredPsychologists.length} of {psychologists.length} psychologists
                    </p>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <LoadingState message="Loading..." />
            ) : activeTab === 'PSYCHOLOGISTS' ? (
                // Psychologists Grid
                filteredPsychologists.length === 0 ? (
                    <EmptyState message="No psychologists found matching your criteria" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPsychologists.map((psychologist) => (
                            <div
                                key={psychologist.id}
                                className="rounded-lg border border-border bg-surface p-6 flex flex-col items-center shadow hover:border-primary transition-colors cursor-pointer"
                                onClick={() => navigate(`/psychologist/${psychologist.id}`)}
                            >
                                {/* Profile Image */}
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-background border-2 border-border flex items-center justify-center mb-4">
                                    {psychologist.profileImage ? (
                                        <img
                                            src={getMediaUrl(psychologist.profileImage)}
                                            alt={psychologist.alias}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.nextElementSibling?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <User size={40} className={`text-textMuted ${psychologist.profileImage ? 'hidden' : ''}`} />
                                </div>

                                {/* Name */}
                                <h3 className="text-lg font-semibold text-text text-center mb-1">{psychologist.alias}</h3>

                                {/* Specialties */}
                                {psychologist.specialties && psychologist.specialties.length > 0 && (
                                    <div className="flex flex-wrap gap-1 justify-center mb-2">
                                        {psychologist.specialties.slice(0, 3).map((specialty, idx) => (
                                            <span
                                                key={idx}
                                                className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                                            >
                                                {specialty}
                                            </span>
                                        ))}
                                        {psychologist.specialties.length > 3 && (
                                            <span className="text-xs px-2 py-1 bg-background text-textMuted rounded-full">
                                                +{psychologist.specialties.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Short Bio */}
                                {psychologist.bio && (
                                    <p className="text-sm text-textMuted mb-3 text-center line-clamp-2">{psychologist.bio}</p>
                                )}

                                {/* View Profile Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/psychologist/${psychologist.id}`);
                                    }}
                                    className="w-full mt-auto"
                                >
                                    View Profile
                                </Button>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // Group Sessions Grid
                groupSessions.length === 0 ? (
                    <EmptyState message="No available group sessions at the moment" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupSessions.map((session) => (
                            <div key={session.id} className="rounded-lg border border-border bg-surface p-6 flex flex-col hover:border-primary transition-colors">
                                <h3 className="text-xl font-bold text-text mb-2">{session.title || 'Group Session'}</h3>
                                <p className="text-sm text-textMuted mb-4">
                                    Hosted by <span className="text-primary font-medium">{session.psychologist?.alias}</span>
                                </p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textMuted">Date</span>
                                        <span className="text-text">{new Date(session.startTime).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textMuted">Time</span>
                                        <span className="text-text">{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textMuted">Duration</span>
                                        <span className="text-text">
                                            {Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} mins
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textMuted">Price</span>
                                        <span className="text-green-500 font-bold">${session.price}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-textMuted">Spots</span>
                                        <span className="text-text">
                                            {session.participants?.length || 0} / {session.maxParticipants}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleJoinGroup(session.id)}
                                    className="w-full mt-auto"
                                    disabled={session.participants?.length >= session.maxParticipants}
                                >
                                    {session.participants?.length >= session.maxParticipants ? 'Full' : 'Join Session'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default FindPsychologist;
