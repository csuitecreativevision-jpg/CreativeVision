import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Check,
    CheckCheck,
    X,
    Calendar,
    Briefcase,
    Info,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    Trash2
} from 'lucide-react';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    subscribeToNotifications,
    type Notification
} from '../../services/notificationService';

// ─── Helpers ────────────────────────────────────────────────────────────

function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: string) {
    switch (type) {
        case 'leave_request':
        case 'leave_response':
            return <Calendar className="w-4 h-4" />;
        case 'assignment':
            return <Briefcase className="w-4 h-4" />;
        case 'project_complete':
            return <CheckCircle2 className="w-4 h-4" />;
        case 'success':
            return <CheckCircle2 className="w-4 h-4" />;
        case 'warning':
            return <AlertTriangle className="w-4 h-4" />;
        default:
            return <Info className="w-4 h-4" />;
    }
}

function getNotificationColor(type: string) {
    switch (type) {
        case 'leave_request':
            return { bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' };
        case 'leave_response':
            return { bg: 'bg-violet-500/10', ring: 'ring-violet-500/20', text: 'text-violet-400', dot: 'bg-violet-400' };
        case 'assignment':
            return { bg: 'bg-blue-500/10', ring: 'ring-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' };
        case 'project_complete':
            return { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' };
        case 'success':
            return { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' };
        case 'warning':
            return { bg: 'bg-red-500/10', ring: 'ring-red-500/20', text: 'text-red-400', dot: 'bg-red-400' };
        default:
            return { bg: 'bg-white/5', ring: 'ring-white/10', text: 'text-gray-400', dot: 'bg-gray-400' };
    }
}

// ─── Component ──────────────────────────────────────────────────────────

interface NotificationBellProps {
    onNotificationClick?: (notification: Notification) => void | Promise<void>;
}

export function NotificationBell({ onNotificationClick }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const userEmail = localStorage.getItem('portal_user_email') || '';

    // Recompute unread from the local state
    const computeUnread = useCallback((notifs: Notification[]) => {
        return notifs.filter(n => !n.is_read).length;
    }, []);

    // Load notifications
    const loadNotifications = useCallback(async () => {
        if (!userEmail) return;
        setLoading(true);
        try {
            const result = await getUserNotifications(userEmail);
            if (result.success && result.data) {
                setNotifications(result.data);
                setUnreadCount(computeUnread(result.data));
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userEmail, computeUnread]);

    // Initial load
    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // Realtime subscription
    useEffect(() => {
        if (!userEmail) return;

        const unsubscribe = subscribeToNotifications(userEmail, (newNotification) => {
            setNotifications(prev => [newNotification, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
        });

        return unsubscribe;
    }, [userEmail]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target as Node) &&
                bellRef.current &&
                !bellRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // ─── Actions ────────────────────────────────────────────────────────

    const handleMarkAsRead = async (id: string) => {
        const result = await markAsRead(id);
        if (result.success) {
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleMarkAllAsRead = async () => {
        const result = await markAllAsRead(userEmail);
        if (result.success) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    const handleDelete = async (id: string, wasUnread: boolean) => {
        const result = await deleteNotification(id);
        if (result.success) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleDismissAll = async () => {
        const result = await deleteAllNotifications(userEmail);
        if (result.success) {
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────

    return (
        <div className="relative" ref={bellRef}>
            {/* Bell Button */}
            <button
                id="notification-bell-trigger"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-all duration-300 group"
            >
                <Bell className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-110'}`} />

                {/* Unread Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute -top-1.5 -right-1.5 flex items-center justify-center"
                        >
                            <span className="absolute w-full h-full rounded-full bg-red-500/40 animate-ping" />
                            <span className="relative min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg shadow-red-500/30">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        id="notification-panel"
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-3 w-[380px] max-h-[520px] flex flex-col rounded-2xl border border-white/10 bg-[#131322]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 z-[100] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 rounded-lg bg-violet-500/10">
                                    <Sparkles className="w-4 h-4 text-violet-400" />
                                </div>
                                <h3 className="text-sm font-black text-white tracking-tight">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-emerald-400 transition-colors"
                                        title="Mark all as read"
                                    >
                                        <CheckCheck className="w-4 h-4" />
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={handleDismissAll}
                                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors"
                                        title="Dismiss all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading && notifications.length === 0 ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                        <Bell className="w-7 h-7 text-gray-600" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 mb-1">All caught up!</p>
                                    <p className="text-xs text-gray-600 text-center">No notifications yet. We'll keep you posted on updates.</p>
                                </div>
                            ) : (
                                <div className="py-1">
                                    {notifications.map((notification, index) => {
                                        const colors = getNotificationColor(notification.type);
                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className={`group relative px-4 py-3 mx-1 my-0.5 rounded-xl transition-all duration-200 cursor-pointer ${
                                                    notification.is_read
                                                        ? 'hover:bg-white/[0.03]'
                                                        : 'bg-white/[0.03] hover:bg-white/[0.06]'
                                                }`}
                                                onClick={async () => {
                                                    if (onNotificationClick) {
                                                        await onNotificationClick(notification);
                                                        setIsOpen(false);
                                                    }
                                                    if (!notification.is_read) handleMarkAsRead(notification.id);
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    {/* Icon */}
                                                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${colors.bg} ring-1 ${colors.ring} flex items-center justify-center ${colors.text}`}>
                                                        {getNotificationIcon(notification.type)}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={`text-xs font-bold leading-tight ${
                                                                notification.is_read ? 'text-gray-400' : 'text-white'
                                                            }`}>
                                                                {notification.title}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {!notification.is_read && (
                                                                    <div className={`w-2 h-2 rounded-full ${colors.dot} shadow-lg`} />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className={`text-[11px] mt-0.5 leading-relaxed line-clamp-2 ${
                                                            notification.is_read ? 'text-gray-600' : 'text-gray-400'
                                                        }`}>
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-gray-600 mt-1.5 font-medium">
                                                            {getRelativeTime(notification.created_at)}
                                                        </p>
                                                    </div>

                                                    {/* Actions - visible on hover */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkAsRead(notification.id);
                                                                }}
                                                                className="p-1 rounded-md hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(notification.id, !notification.is_read);
                                                            }}
                                                            className="p-1 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-center">
                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">
                                    Showing latest {notifications.length} notifications
                                </span>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
