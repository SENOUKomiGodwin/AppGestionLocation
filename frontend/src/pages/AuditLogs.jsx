import { useEffect, useState } from 'react';
import { Search, ScrollText } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { auditApi } from '../api';
import { formatDate } from '../utils/format';

const ACTION_LABELS = {
  created: { label: 'Création', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  updated: { label: 'Modification', color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400' },
  deleted: { label: 'Suppression', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  payment: { label: 'Paiement', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' },
  login: { label: 'Connexion', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' },
  logout: { label: 'Déconnexion', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' },
  register: { label: 'Inscription', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
  renewed: { label: 'Renouvellement', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  settings_updated: { label: 'Paramètres', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' },
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await auditApi.all({ search: search || undefined, per_page: 20, page });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search, page]);

  const actionMeta = (action) => ACTION_LABELS[action] ?? { label: action, color: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <PageHeader title="Journal d'audit" subtitle="Trace de toutes les actions sensibles de la plateforme" />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10" placeholder="Rechercher une action…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/70 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                <tr>
                  <th className="th">Action</th>
                  <th className="th">Utilisateur</th>
                  <th className="th">Entité</th>
                  <th className="th">Détails</th>
                  <th className="th">IP</th>
                  <th className="th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.data ?? []).map((log) => {
                  const meta = actionMeta(log.action);
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                      <td className="td"><span className={`badge ${meta.color}`}>{meta.label}</span></td>
                      <td className="td">{log.user?.name ?? <span className="text-gray-400">Système</span>}</td>
                      <td className="td text-gray-500 dark:text-gray-400">
                        {log.model_type ? `${log.model_type}${log.model_id ? ` #${log.model_id}` : ''}` : '—'}
                      </td>
                      <td className="td max-w-xs truncate text-xs text-gray-400">
                        {log.changes ? JSON.stringify(log.changes) : '—'}
                      </td>
                      <td className="td text-xs text-gray-400">{log.ip_address || '—'}</td>
                      <td className="td text-xs text-gray-400">{formatDate(log.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={<ScrollText className="h-6 w-6" />} title="Aucune action journalisée" />
      )}

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}
