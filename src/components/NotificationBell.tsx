import client from '@/api/client';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    createdAt: string;
}

const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadNotifications();
        // Poll for notifications every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const res = await client.get('/notifications');
            const data = res.data.data || res.data;
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (error) {
            console.error('Failed to load notifications');
        }
    };

    const markAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await client.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        setIsOpen(false);
        if (!notification.isRead) {
            markAsRead(notification.id, { stopPropagation: () => { } } as React.MouseEvent);
        }

        // Navigate based on type
        switch (notification.type) {
            case 'WITHDRAWAL_REQUEST':
            case 'WITHDRAWAL_APPROVED':
            case 'WITHDRAWAL_REJECTED':
                navigate('/wallet');
                break;
            case 'PAYMENT_COMPLETED':
                navigate('/wallet');
                break;
            case 'SESSION_REMINDER':
                navigate('/sessions');
                break;
            default:
                break;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-textMuted hover:text-text hover:bg-background rounded-full transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                        <div className="p-3 border-b border-border flex justify-between items-center">
                            <h3 className="font-semibold text-text text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={async () => {
                                        await client.post('/notifications/mark-all-read');
                                        loadNotifications();
                                    }}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`
                                            p-3 border-b border-border last:border-0 cursor-pointer hover:bg-background transition-colors
                                            ${notification.isRead ? 'opacity-70' : 'bg-primary/5'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <p className={`text-sm ${notification.isRead ? 'text-text' : 'text-text font-semibold'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-textMuted mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-textMuted mt-1">
                                                    {new Date(notification.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 text-textMuted hover:text-primary"
                                                    onClick={(e) => markAsRead(notification.id, e)}
                                                >
                                                    <Check size={14} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-textMuted text-sm">
                                    No notifications
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
