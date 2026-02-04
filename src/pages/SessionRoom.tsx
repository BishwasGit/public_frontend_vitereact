import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/button';
import {
    ControlBar,
    LiveKitRoom,
    RoomAudioRenderer,
    VideoConference,
    useParticipants,
    useRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
    ArrowLeft,
    MessageSquare,
    Phone,
    Users,
    VideoOff,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import client from '../api/client';

// LiveKit server URL - typically should come from env
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

interface SessionInfo {
    id: string;
    psychologistId: string;
    patientId: string;
    status: string;
    endTime?: string;
    startTime?: string;
    psychologist: {
        alias: string;
    };
    patient: {
        alias: string;
    } | null;
    participants?: {
        id: string;
        alias: string;
    }[];
}

// Custom Stage component with participant view
function Stage() {
    const participants = useParticipants();

    return (
        <div className="flex flex-col h-full">
            {/* Participant count */}
            <div className="flex items-center gap-2 p-3 bg-surface/50 border-b border-border">
                <Users size={18} className="text-primary" />
                <span className="text-sm text-textMuted">
                    {participants.length} participant{participants.length !== 1 ? 's' : ''} in room
                </span>
            </div>

            {/* Video grid */}
            <div className="flex-1 p-4">
                <VideoConference />
            </div>
        </div>
    );
}

// Chat Component for in-session messaging
function SessionChat() {
    const [messages, setMessages] = useState<{ sender: string; text: string; time: Date }[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const room = useRoomContext();
    const { user } = useAuth();

    useEffect(() => {
        if (!room) return;

        const handleDataReceived = (payload: Uint8Array) => {
            try {
                const decoder = new TextDecoder();
                const data = JSON.parse(decoder.decode(payload));
                if (data.type === 'chat') {
                    setMessages(prev => [...prev, {
                        sender: data.sender,
                        text: data.text,
                        time: new Date(),
                    }]);
                }
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        };

        room.on('dataReceived', handleDataReceived);
        return () => {
            room.off('dataReceived', handleDataReceived);
        };
    }, [room]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !room) return;

        const data = {
            type: 'chat',
            sender: user?.alias || 'Anonymous',
            text: newMessage.trim(),
        };

        try {
            const encoder = new TextEncoder();
            await room.localParticipant.publishData(
                encoder.encode(JSON.stringify(data)),
                { reliable: true }
            );

            // Add to local messages
            setMessages(prev => [...prev, {
                sender: 'You',
                text: newMessage.trim(),
                time: new Date(),
            }]);
            setNewMessage('');
        } catch (e) {
            console.error('Failed to send message:', e);
            toast.error('Failed to send message');
        }
    };

    return (
        <div className="flex flex-col h-full bg-surface border-l border-border">
            <div className="p-3 border-b border-border">
                <h3 className="font-semibold text-text flex items-center gap-2">
                    <MessageSquare size={18} />
                    Session Chat
                </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <p className="text-textMuted text-sm text-center py-4">
                        No messages yet. Start the conversation!
                    </p>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`${msg.sender === 'You' ? 'text-right' : ''}`}>
                            <div className={`inline-block max-w-[80%] rounded-lg p-2 ${msg.sender === 'You'
                                ? 'bg-primary text-white'
                                : 'bg-background text-text'
                                }`}>
                                <p className="text-xs font-medium mb-1 opacity-70">{msg.sender}</p>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-text text-sm focus:outline-none focus:border-primary"
                    />
                    <Button size="sm" onClick={sendMessage}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}

const SessionRoom = () => {
    const { user } = useAuth();
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string>(LIVEKIT_URL);
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Load session info and get token
    useEffect(() => {
        const initializeRoom = async () => {
            if (!sessionId) {
                setError('No session ID provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // 1. Load session details
                const sessionRes = await client.get(`/sessions/${sessionId}`);
                const sessionData = sessionRes.data.data || sessionRes.data;
                setSession(sessionData);

                // 2. Verify user is part of this session
                const isPsychologist = sessionData.psychologistId === user?.id;
                const isPatient = sessionData.patientId === user?.id;
                const isParticipant = sessionData.participants?.some((p: any) => p.id === user?.id);

                if (!isPsychologist && !isPatient && !isParticipant) {
                    setError('You are not authorized to join this session');
                    setLoading(false);
                    return;
                }

                // 3. Check if session is LIVE (psychologist must start it first)
                if (sessionData.status !== 'LIVE') {
                    if (isPatient) {
                        setError('Session has not started yet. Please wait for the psychologist to start the session.');
                    } else {
                        setError('Session is not active. Please start the session from the session details page.');
                    }
                    setLoading(false);
                    return;
                }

                // 4. Generate room name based on session ID
                const roomName = `session-${sessionId}`;

                // 5. Get LiveKit token from backend
                const tokenRes = await client.post('/video/token', { roomName });
                const tokenData = tokenRes.data.data || tokenRes.data;

                if (!tokenData.token) {
                    setError('Unable to get session token');
                    setLoading(false);
                    return;
                }

                setToken(tokenData.token);

                // Use server URL from backend if provided
                if (tokenData.serverUrl) {
                    setServerUrl(tokenData.serverUrl);
                }

                // 6. Update psychologist status to BUSY (if not already)
                if (user?.role === 'PSYCHOLOGIST') {
                    await client.patch('/profile', { status: 'BUSY' });
                }

            } catch (err: unknown) {
                console.error('Failed to initialize room:', err);
                const errorMessage = err instanceof Error
                    ? err.message
                    : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to join session room';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        initializeRoom();
    }, [sessionId, user]);

    const handleDisconnect = useCallback(async () => {
        try {
            // Set status back to ONLINE when leaving
            if (user?.role === 'PSYCHOLOGIST') {
                await client.patch('/profile/status', { status: 'ONLINE' });
            }
            toast.success('Left session room');
            navigate(`/sessions/${sessionId}`);
        } catch (err) {
            console.error('Error during disconnect:', err);
            navigate(`/sessions/${sessionId}`);
        }
    }, [user, sessionId, navigate]);

    const handleConnected = useCallback(() => {
        setIsConnected(true);
        toast.success('Connected to session room');
    }, []);

    const handleError = useCallback((error: Error) => {
        console.error('LiveKit error:', error);
        toast.error(`Connection error: ${error.message}`);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-textMuted">Connecting to session room...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center max-w-md p-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <VideoOff size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold text-text mb-2">Unable to Join Session</h2>
                    <p className="text-textMuted mb-6">{error}</p>
                    <Button onClick={() => navigate('/sessions')}>
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Sessions
                    </Button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <p className="text-textMuted">Unable to get session token</p>
                    <Button onClick={() => navigate('/sessions')} className="mt-4">
                        Back to Sessions
                    </Button>
                </div>
            </div>
        );
    }

    const otherParticipant = user?.role === 'PSYCHOLOGIST'
        ? (session?.participants?.length ? 'Group' : session?.patient?.alias)
        : session?.psychologist.alias;

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isUrgent, setIsUrgent] = useState(false);
    const [demoState, setDemoState] = useState<{ active: boolean; remaining: number }>({ active: false, remaining: 0 });

    // Fetch demo info
    useEffect(() => {
        const fetchDemoInfo = async () => {
            if (!session?.psychologistId || !user) return;
            try {
                // If patient, check their remaining demo
                if (user.role === 'PATIENT') {
                    const res = await client.get(`/demo-minutes/psychologist/${session.psychologistId}`);
                    const remaining = res.data.data?.remaining || res.data.remaining || 0;
                    setDemoState(prev => ({ ...prev, remaining }));
                }
            } catch (error) {
                console.error('Failed to fetch demo info', error);
            }
        };
        fetchDemoInfo();
    }, [session?.psychologistId, user]);

    useEffect(() => {
        if (!session?.endTime) return;

        const updateTimer = () => {
            const now = new Date();
            const end = new Date(session.endTime as string);
            const diff = end.getTime() - now.getTime();

            // Demo Status Update
            if (session.startTime && demoState.remaining > 0) {
                const start = new Date(session.startTime as string).getTime();
                const elapsedMinutes = (now.getTime() - start) / 60000;
                const isDemo = elapsedMinutes < demoState.remaining;
                setDemoState(prev => ({ ...prev, active: isDemo }));
            }

            if (diff <= 0) {
                setTimeLeft('00:00');
                setIsUrgent(true);
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            setIsUrgent(minutes < 5); // Urgent if less than 5 minutes
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [session?.endTime, session?.startTime, demoState.remaining]);

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="font-semibold text-text">Session Room</h1>
                        <p className="text-sm text-textMuted">
                            {session?.participants?.length && session.participants.length > 0
                                ? `${session.participants.length} Participant(s)`
                                : otherParticipant
                                    ? `With ${otherParticipant}`
                                    : 'Waiting for participant...'}
                        </p>
                    </div>
                </div>

                {/* Center: Status & Timer */}
                <div className="flex items-center gap-3">
                    {demoState.active && (
                        <div className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full text-sm font-semibold border border-green-500/20 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Free Demo Active
                        </div>
                    )}

                    {timeLeft && (
                        <div className={`px-4 py-1.5 rounded-full font-mono text-lg font-bold border ${isUrgent
                            ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                            : 'bg-primary/10 text-primary border-primary/20'
                            }`}>
                            {timeLeft}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isConnected && (
                        <span className="flex items-center gap-2 text-sm text-green-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Connected
                        </span>
                    )}
                    <Button
                        variant={showChat ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowChat(!showChat)}
                    >
                        <MessageSquare size={16} className="mr-2" />
                        Chat
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDisconnect}
                    >
                        <Phone size={16} className="mr-2" />
                        Leave
                    </Button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video area */}
                <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'}`}>
                    <LiveKitRoom
                        token={token}
                        serverUrl={serverUrl}
                        connect={true}
                        video={{
                            deviceId: undefined,
                            facingMode: 'user',
                        }}
                        audio={{
                            deviceId: undefined,
                        }}
                        onConnected={handleConnected}
                        onDisconnected={handleDisconnect}
                        onError={handleError}
                        data-lk-theme="default"
                        style={{ height: '100%' }}
                        options={{
                            adaptiveStream: true,
                            dynacast: true,
                            videoCaptureDefaults: {
                                resolution: {
                                    width: 1280,
                                    height: 720,
                                    frameRate: 30,
                                },
                            },
                            audioCaptureDefaults: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                autoGainControl: true,
                                // @ts-ignore - RED option exists in internal SDK but missing from types in some versions
                                red: false,
                            },
                        }}
                    >
                        <Stage />
                        <RoomAudioRenderer />
                        <ControlBar
                            variation="minimal"
                            controls={{
                                camera: true,
                                microphone: true,
                                screenShare: false,
                                leave: false,
                                chat: false,
                            }}
                        />
                    </LiveKitRoom>
                </div>

                {/* Chat sidebar */}
                {showChat && (
                    <div className="w-1/3 min-w-[300px] max-w-[400px]">
                        <SessionChat />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionRoom;
