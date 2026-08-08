import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, MapPin, Search, BedDouble, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { housesApi } from '../../api';
import { useDebounce } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';

export default function Houses() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const debounced = useDebounce(search);

  const load = async () => {
    setLoading(true);
    try {
      const res = await housesApi.all({ search: debounced || undefined, per_page: 12, page });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  // Recharge au changement de recherche ou de page
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, page]);

  return (
    <div>
      <PageHeader
        title="Maisons"
        subtitle="Gérez vos immeubles, villas et résidences"
        actions={can('manage-houses') && (
          <Link to="/houses/new" className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle maison</Link>
        )}
      />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10"
          placeholder="Rechercher une maison…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.data ?? []).map((house, i) => (
            <motion.div
              key={house.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/houses/${house.id}`} className="card group block overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card-lg">
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700">
                  {house.photo ? (
                    <img src={house.photo} alt={house.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Building2 className="h-14 w-14 text-white/40" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <h3 className="text-lg font-bold text-white">{house.name}</h3>
                    <p className="flex items-center gap-1 text-xs text-white/80"><MapPin className="h-3 w-3" /> {house.address}{house.city ? `, ${house.city}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4" /> {house.number_of_units} logements</span>
                    {house.occupied_units != null && (
                      <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {house.occupied_units} occupés</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">Depuis {formatDate(house.created_at)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState title="Aucune maison trouvée" description="Créez votre première maison pour commencer à gérer vos logements."
          action={can('manage-houses') && <Link to="/houses/new" className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle maison</Link>} />
      )}

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}
    </div>
  );
}
