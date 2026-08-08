import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Mail, MessageSquare, Smartphone, BellRing } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { notificationsApi } from '../api';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';

const ICONS = { alert: '🔴', calendar: '📅', check: '✅', document: '📄', bell: '🔔' };

export default function Notifications() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.all({ per_page: 15, page });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page]);

  const markAll = async () => {
    await notificationsApi.markAllRead();
    toast.success('Toutes les notifications sont lues.');
    load();
  };

  const read = async (n) => {
    if (!n.read_at) {
      await notificationsApi.markAsRead(n.id);
      load();
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Alertes d'échéances, retards de paiement et rappels"
        actions={<button className="btn-secondary" onClick={markAll}><CheckCheck className="h-4 w-4" /> Tout marquer comme lu</button>}
      />

      {/* Canaux disponibles */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Bell, label: 'In-app', desc: 'Actif' },
          { icon: Mail, label: 'Email', desc: 'Configurable' },
          { icon: MessageSquare, label: 'WhatsApp', desc: 'À brancher' },
          { icon: Smartphone, label: 'SMS / Push', desc: 'À brancher' },
        ].map((c) => (
          <div key={c.label} className="card flex items-center gap-3 p-4">
            <c.icon className="h-5 w-5 text-brand-500" />
            <div>
              <p className="text-sm font-semibold">{c.label}</p>
              <p className="text-xs text-gray-400">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="space-y-2.5">
          {(data?.notifications?.data ?? []).map((n) => (
            <div
              key={n.id}
              onClick={() => read(n)}
              className={`card flex cursor-pointer items-start gap-4 p-4 transition-colors ${n.read_at ? 'opacity-70' : 'border-brand-300/60 dark:border-brand-500/30'}`}
            >
              <span className="text-xl">{ICONS[n.icon] ?? '🔔'}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900 dark:text-white">{n.title}</p>
                  {!n.read_at && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                </div>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(n.created_at)}</p>
              </div>
              {n.url && (
                <Link to={n.url} onClick={(e) => e.stopPropagation()} className="btn-secondary !px-3 !py-1.5 text-xs shrink-0">
                  Voir
                </Link>
              )}
            </div>
          ))}
          {data && data.notifications.data.length === 0 && (
            <EmptyState icon={<BellRing className="h-6 w-6" />} title="Aucune notification" description="Les rappels d'échéances et de retards apparaîtront ici." />
          )}
        </div>
      )}

      {data && <Pagination meta={data.notifications.meta} onPageChange={setPage} />}
    </div>
  );
}
