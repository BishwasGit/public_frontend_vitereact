import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
    activeUser: any;
    messages: any[];
    currentUserId: string;
    onSendMessage: (content: string) => void;
    sending: boolean;
}

const ChatWindow = ({ activeUser, messages, currentUserId, onSendMessage, sending }: ChatWindowProps) => {
    const [newMessage, setNewMessage] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if(!newMessage.trim()) return;
        
        onSendMessage(newMessage);
        setNewMessage('');
    };

    if (!activeUser) {
        return (
            <div className="flex-1 flex items-center justify-center text-textMuted flex-col gap-4">
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center">
                    <Send size={24} className="opacity-50" />
                </div>
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f0f12]">
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">{activeUser.alias}</h3>
                    <p className="text-xs text-textMuted">{activeUser.role}</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-textMuted text-sm mt-10">
                        <p>No messages yet.</p>
                        <p>Say hello to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            content={msg.content}
                            isOwn={msg.senderId === currentUserId}
                            senderName={msg.senderId === currentUserId ? 'You' : activeUser.alias}
                            timestamp={msg.createdAt}
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-surface">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        autoFocus
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
