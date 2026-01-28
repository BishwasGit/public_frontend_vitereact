import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

interface ConversationListProps {
    conversations: any[];
    activeUserId: string | null;
    onSelect: (userId: string) => void;
}

const ConversationList = ({ conversations, activeUserId, onSelect }: ConversationListProps) => {
    // Safety check to ensure conversations is always an array
    const safeConversations = Array.isArray(conversations) ? conversations : [];
    
    return (
        <div className="flex flex-col h-full bg-surface border-r border-border w-80">
            <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Messages</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {safeConversations.length === 0 ? (
                    <div className="p-4 text-center text-textMuted text-sm">
                        No conversations yet.
                    </div>
                ) : (
                    safeConversations.map((conv) => (
                        <button
                            key={conv.user.id}
                            onClick={() => onSelect(conv.user.id)}
                            className={cn(
                                "w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left border-b border-border/50",
                                activeUserId === conv.user.id && "bg-primary/5 border-l-4 border-l-primary"
                            )}
                        >
                            <div className="relative">
                                <Avatar>
                                    <AvatarImage src={conv.user.avatar} />
                                    <AvatarFallback>{conv.user.alias.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {/* Online indicator would go here */}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-medium truncate text-sm">{conv.user.alias}</span>
                                    {conv.lastMessage && (
                                        <span className="text-[10px] text-textMuted">
                                            {new Date(conv.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-textMuted truncate">
                                    {conv.lastMessage?.content || 'No messages yet'}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConversationList;
