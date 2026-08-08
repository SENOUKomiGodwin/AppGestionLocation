import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { notificationsApi } from '../../api';
import { formatDate } from '../../utils/format';

export default function NotificationsBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const [{ data }, { data: count }] = await Promise.all([
        notificationsApi.all({ per_page: 6 }),
        notificationsApi.unreadCount(),
      ]);
      setItems(data.notifications.data);
      setUnread(count.unread_count);
    } catch { /* silencieux */ }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await notificationsApi.markAllRead();
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  };

  const icons = { alert: '🔴', calendar: '📅', check: '✅', document: '📄', bell: '🔔' };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-card-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-3 dark:border-gray-800">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button onClick={markAll} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  <CheckCheck className="h-3.5 w-3.5" /> Tout lire
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">Aucune notification</p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    to={n.url || '/notifications'}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${n.read_at ? '' : 'bg-brand-50/50 dark:bg-brand-500/5'}`}
                  >
                    <span className="mt-0.5 text-base">{icons[n.icon] ?? '🔔'}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{formatDate(n.created_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-gray-200/70 px-4 py-2.5 text-center text-xs font-semibold text-brand-600 hover:bg-gray-50 dark:border-gray-800 dark:text-brand-400 dark:hover:bg-gray-800/50"
            >
              Voir toutes les notifications
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
