import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Phone } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { tenantsApi } from '../../api';
import { useDebounce } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';


export default function Tenants() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const debounced = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      const res = await tenantsApi.all({ search: debounced || undefined, per_page: 15, page });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [debounced, page]);

  return (
    <div>
      <PageHeader
        title="Locataires"
        subtitle="Gérez vos locataires et leurs contrats"
        actions={can('manage-tenants') && <Link to="/tenants/new" className="btn-primary"><Plus className="h-4 w-4" /> Nouveau locataire</Link>}
      />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10" placeholder="Rechercher un locataire…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.data ?? []).map((tenant) => (
            <Link key={tenant.id} to={`/tenants/${tenant.id}`} className="card group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-lg">
              {tenant.photo ? (
                <img src={tenant.photo} alt={tenant.full_name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {tenant.initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900 dark:text-white">{tenant.full_name}</p>
                <p className="truncate text-xs text-gray-400">{tenant.profession || tenant.nationality}</p>
                {tenant.phone && <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400"><Phone className="h-3 w-3" /> {tenant.phone}</p>}
                <p className="mt-1 text-xs">
                  {tenant.active_contract ? (
                    <span className="font-medium text-brand-600 dark:text-brand-400">{tenant.active_contract.unit?.house?.name} · {tenant.active_contract.unit?.number}</span>
                  ) : (
                    <span className="text-gray-400">Sans logement</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Aucun locataire trouvé"
          description="Ajoutez votre premier locataire pour créer un contrat." />
      )}

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}
