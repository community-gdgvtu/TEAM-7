import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Trash2, 
  X, 
  Sparkles, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Store,
  Radio
} from 'lucide-react';
import type { NegotiationSession } from '../types';

export type NotificationType = 
  | 'NEGOTIATION_STARTED'
  | 'NEW_OFFER'
  | 'BEST_OFFER_UPDATED'
  | 'NEGOTIATION_COMPLETED'
  | 'OFFER_EXPIRING'
  | 'SELLER_RESPONSE'
  | 'SYSTEM_ERROR';

export interface PanchayatNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  sessionId?: string;
  meta?: { price?: number; sellerName?: string };
}

interface NotificationCenterProps {
  session?: NegotiationSession;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ session }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PanchayatNotification[]>([
    {
      id: 'n-1',
      type: 'BEST_OFFER_UPDATED',
      title: '🔥 New Best Offer Discovered!',
      message: 'Sri Lakshmi Electronics submitted ₹57,024 for Coding Laptop 16GB.',
      timestamp: 'Just now',
      read: false,
      meta: { price: 57024, sellerName: 'Sri Lakshmi Electronics' }
    },
    {
      id: 'n-2',
      type: 'SELLER_RESPONSE',
      title: '🏪 Merchant Counter-Offer Received',
      message: 'Honnur Digital World counter-offered ₹58,320 with 1 Year Warranty.',
      timestamp: '2 mins ago',
      read: false,
      meta: { price: 58320, sellerName: 'Honnur Digital World' }
    },
    {
      id: 'n-3',
      type: 'NEGOTIATION_STARTED',
      title: '⚡ Negotiation Session Active',
      message: 'Panchayat AI contacted 5 local sellers in Hulkoti Market.',
      timestamp: '5 mins ago',
      read: true
    }
  ]);

  // Subscribe to live Fact Bus events to generate real-time notifications
  useEffect(() => {
    if (!session || !session.events) return;

    const latestEvent = session.events[session.events.length - 1];
    if (latestEvent) {
      let notifType: NotificationType = 'NEW_OFFER';
      const evTypeStr = String(latestEvent.eventType);
      if (evTypeStr === 'BEST_OFFER_UPDATED') notifType = 'BEST_OFFER_UPDATED';
      else if (evTypeStr === 'NEGOTIATION_COMPLETED') notifType = 'NEGOTIATION_COMPLETED';
      else if (evTypeStr === 'SESSION_START' || evTypeStr === 'SESSION_CREATED') notifType = 'NEGOTIATION_STARTED';

      const newNotif: PanchayatNotification = {
        id: `notif-${Date.now()}`,
        type: notifType,
        title: latestEvent.eventType.replace(/_/g, ' '),
        message: latestEvent.message || 'Live Fact Bus update recorded.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        meta: { price: latestEvent.price, sellerName: latestEvent.sellerName }
      };

      setNotifications((prev) => {
        if (prev.some((n) => n.message === newNotif.message)) return prev;
        return [newNotif, ...prev];
      });
    }
  }, [session?.events?.length]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleMarkSingleAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'BEST_OFFER_UPDATED':
        return <TrendingDown className="w-4 h-4 text-emerald-400" />;
      case 'NEGOTIATION_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'OFFER_EXPIRING':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'SELLER_RESPONSE':
        return <Store className="w-4 h-4 text-indigo-400" />;
      case 'SYSTEM_ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative">
      
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer shadow-md"
        aria-label="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px] flex items-center justify-center border-2 border-slate-950 shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Popover Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 z-50 animate-fadeIn text-slate-100 space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkSingleAsRead(n.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                    n.read 
                      ? 'bg-slate-950/60 border-slate-800/80 text-slate-400' 
                      : 'bg-slate-950 border-amber-500/30 text-white font-medium shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      {getIconForType(n.type)} {n.title}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">{n.timestamp}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs">
              <span className="text-[10px] text-slate-500 font-mono">Fact Bus Stream Active</span>
              <button
                onClick={handleClearAll}
                className="text-[11px] font-bold text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Clear all
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
