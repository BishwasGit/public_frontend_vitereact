import client from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';

const ChatLayout = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [activeUserId, setActiveUserId] = useState<string | null>(null);
    const [activeUser, setActiveUser] = useState<any>(null);
    const [sending, setSending] = useState(false);

    // Initial load
    useEffect(() => {
        loadConversations();
    }, []);

    // Load messages when active user changes
    useEffect(() => {
        if (activeUserId) {
            loadMessages(activeUserId);
            // Poll for new messages every 5 seconds (Simple implementation)
            const interval = setInterval(() => loadMessages(activeUserId), 5000);
            return () => clearInterval(interval);
        }
    }, [activeUserId]);

    const loadConversations = async () => {
        try {
            const res = await client.get('/messages/conversations');
            setConversations(res.data.data || res.data || []);
        } catch (error) {
            console.error('Failed to load conversations:', error);
            setConversations([]);
        }
    };

    const loadMessages = async (userId: string) => {
        try {
            const res = await client.get(`/messages/conversation/${userId}`);
            setMessages(res.data.data || res.data || []);
            
            // Also find the user details if not already set (reloading conversations might be needed)
            if(!activeUser){
                 const conv = conversations.find(c => c.user.id === userId);
                 if(conv) setActiveUser(conv.user);
                 else {
                     // If fresh, might need to fetch user details separately or reload conversations
                     loadConversations();
                 }
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            setMessages([]);
        }
    };

    const handleSendMessage = async (content: string) => {
        if (!activeUserId) return;
        
        try {
            setSending(true);
            await client.post('/messages', {
                senderId: user?.id,
                receiverId: activeUserId,
                content,
            });
            
            // Reload messages immediately
            await loadMessages(activeUserId);
            loadConversations(); // Update list order/preview
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleSelectConversation = (userId: string) => {
        setActiveUserId(userId);
        const conv = conversations.find(c => c.user.id === userId);
        if(conv) setActiveUser(conv.user);
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] rounded-lg border border-border overflow-hidden">
            <div className={`w-full md:w-1/3 border-r border-border md:block ${activeUserId ? 'hidden' : 'block'}`}>
                <ConversationList 
                    conversations={conversations}
                    activeUserId={activeUserId}
                    onSelect={handleSelectConversation}
                />
            </div>
            <div className={`w-full md:w-2/3 md:block ${!activeUserId ? 'hidden' : 'block'}`}>
                {activeUserId ? (
                    <div className="h-full flex flex-col">
                        <div className="md:hidden p-2 border-b border-border bg-surface">
                            <button 
                                onClick={() => setActiveUserId(null)}
                                className="text-sm text-primary font-medium"
                            >
                                &larr; Back to conversations
                            </button>
                        </div>
                        <ChatWindow 
                            activeUser={activeUser}
                            messages={messages}
                            currentUserId={user?.id || ''}
                            onSendMessage={handleSendMessage}
                            sending={sending}
                        />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-textMuted hidden md:flex">
                        Select a conversation to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatLayout;
