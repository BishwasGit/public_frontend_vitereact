import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

interface MessageBubbleProps {
    content: string;
    isOwn: boolean;
    senderName: string;
    timestamp: string;
    avatar?: string;
}

const MessageBubble = ({ content, isOwn, senderName, timestamp, avatar }: MessageBubbleProps) => {
    return (
        <div className={cn("flex w-full mb-4", isOwn ? "justify-end" : "justify-start")}>
            <div className={cn("flex max-w-[70%] gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{senderName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className={cn(
                    "flex flex-col", 
                    isOwn ? "items-end" : "items-start"
                )}>
                    <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm",
                        isOwn 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-surface border border-border text-text rounded-tl-none"
                    )}>
                        {content}
                    </div>
                    <span className="text-[10px] text-textMuted mt-1 px-1">
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
