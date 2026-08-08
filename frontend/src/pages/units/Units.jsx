import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, DoorOpen, Filter } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import { unitsApi } from '../../api';
import { useDebounce } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../utils/format';

const STATUSES = [
  { value: '', label: 'Tous les statuts' },
  { value: 'libre', label: 'Libres' },
  { value: 'occupe', label: 'Occupés' },
  { value: 'renovation', label: 'En rénovation' },
];

export default function Units() {
  const { can, settings } = useAuth();
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
      const res = await unitsApi.all({ search: debounced || undefined, status: status || undefined, per_page: 15, page });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [debounced, status, page]);

  return (
    <div>
      <PageHeader
        title="Logements"
        subtitle="Tous vos appartements, studios et locaux"
        actions={can('manage-houses') && <Link to="/units/new" className="btn-primary"><Plus className="h-4 w-4" /> Nouveau logement</Link>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Rechercher par n° ou maison…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="relative">
          <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select className="input pl-10 w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/70 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                <tr>
                  <th className="th">Logement</th>
                  <th className="th">Maison</th>
                  <th className="th">Caractéristiques</th>
                  <th className="th">Loyer</th>
                  <th className="th">Locataire</th>
                  <th className="th">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.data ?? []).map((unit) => (
                  <tr key={unit.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <td className="td">
                      <Link to={`/units/${unit.id}/edit`} className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          {unit.number}
                        </div>
                        <span className="font-semibold">{unit.type_label}</span>
                      </Link>
                    </td>
                    <td className="td">{unit.house?.name ?? '—'}</td>
                    <td className="td text-gray-500 dark:text-gray-400">
                      {unit.bedrooms} ch. · {unit.surface} m²
                    </td>
                    <td className="td font-semibold">{formatMoney(unit.rent_amount, currency)}</td>
                    <td className="td">{unit.current_tenant?.full_name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="td"><Badge status={unit.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={<DoorOpen className="h-6 w-6" />} title="Aucun logement trouvé"
          description="Modifiez vos filtres ou créez un nouveau logement." />
      )}

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}
