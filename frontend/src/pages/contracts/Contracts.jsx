import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { contractsApi } from '../../api';
import { downloadFile } from '../../api/client';
import { useDebounce } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatMoney, formatDate } from '../../utils/format';

const STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'expire', label: 'Expirés' },
  { value: 'resilie', label: 'Résiliés' },
  { value: 'renouvele', label: 'Renouvelés' },
];

export default function Contracts() {
  const { can, settings } = useAuth();
  const toast = useToast();
  const currency = settings.currency || 'EUR';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const debounced = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      const res = await contractsApi.all({ search: debounced || undefined, status: status || undefined, per_page: 15, page });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [debounced, status, page]);

  const download = async (e, contract) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await downloadFile(`/contracts/${contract.id}/download`, `contrat-${contract.id}.pdf`);
      toast.success('Contrat téléchargé.');
    } catch {
      toast.error('Impossible de télécharger le contrat.');
    }
  };

  return (
    <div>
      <PageHeader
        title="Contrats"
        subtitle="Baux, renouvellements et historique"
        actions={can('manage-contracts') && <Link to="/contracts/new" className="btn-primary"><Plus className="h-4 w-4" /> Nouveau contrat</Link>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Rechercher un locataire…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/70 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                <tr>
                  <th className="th">Locataire</th>
                  <th className="th">Logement</th>
                  <th className="th">Période</th>
                  <th className="th">Loyer</th>
                  <th className="th">Statut</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.data ?? []).map((contract) => (
                  <tr key={contract.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <td className="td">
                      <Link to={`/contracts/${contract.id}`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          {contract.tenant?.full_name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold">{contract.tenant?.full_name}</span>
                      </Link>
                    </td>
                    <td className="td">{contract.unit?.house?.name} · {contract.unit?.number}</td>
                    <td className="td text-gray-500 dark:text-gray-400">
                      {formatDate(contract.start_date)} → {formatDate(contract.end_date)}
                    </td>
                    <td className="td font-semibold">{formatMoney(contract.monthly_rent, currency)}</td>
                    <td className="td"><Badge status={contract.status} /></td>
                    <td className="td text-right">
                      <button onClick={(e) => download(e, contract)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800" title="Télécharger le PDF">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Aucun contrat trouvé"
          description="Créez un contrat pour un locataire et un logement." />
      )}

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}
