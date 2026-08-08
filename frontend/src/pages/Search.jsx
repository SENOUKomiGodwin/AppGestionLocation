import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Building2, DoorOpen, Users, Wallet, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import { searchApi } from '../api';
import { useDebounce } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';

export default function Search() {
  const { settings } = useAuth();
  const currency = settings.currency || 'EUR';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    if (!debounced.trim()) { setResults(null); return; }
    let cancelled = false;
    setSearching(true);
    searchApi.all({ q: debounced })
      .then(({ data }) => { if (!cancelled) setResults(data.results); })
      .catch(() => { if (!cancelled) setResults(null); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debounced]);

  const Section = ({ title, icon: Icon, children }) => {
    if (!children || children.length === 0) return null;
    return (
      <div className="card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Icon className="h-4 w-4 text-brand-500" /> {title}
          <span className="badge bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">{children.length}</span>
        </h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
      </div>
    );
  };

  const Row = ({ to, title, sub, right }) => (
    <Link to={to} className="flex items-center justify-between gap-4 py-2.5 transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40 rounded-lg px-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        {sub && <p className="truncate text-xs text-gray-400">{sub}</p>}
      </div>
      {right}
    </Link>
  );

  return (
    <div>
      <PageHeader title="Recherche" subtitle="Recherche instantanée sur les maisons, locataires, logements et paiements" />

      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          className="input h-13 py-3.5 pl-12 text-base"
          placeholder="Tapez pour rechercher… (ex : Azur, Koffi, A1, PAY-001)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searching && <p className="text-sm text-gray-400">Recherche…</p>}

      {results && !searching && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Section title="Maisons" icon={Building2} results={results.houses}>
            {results.houses.map((h) => (
              <Row key={h.id} to={`/houses/${h.id}`} title={h.name} sub={`${h.address}${h.city ? `, ${h.city}` : ''}`} />
            ))}
          </Section>
          <Section title="Locataires" icon={Users} results={results.tenants}>
            {results.tenants.map((t) => (
              <Row key={t.id} to={`/tenants/${t.id}`} title={t.full_name} sub={t.profession || t.nationality || t.phone} />
            ))}
          </Section>
          <Section title="Logements" icon={DoorOpen} results={results.units}>
            {results.units.map((u) => (
              <Row key={u.id} to={`/units/${u.id}/edit`} title={`${u.house?.name} · ${u.number}`} sub={`${u.type_label} · ${u.bedrooms} ch. · ${u.surface} m²`} right={<Badge status={u.status} />} />
            ))}
          </Section>
          <Section title="Paiements" icon={Wallet} results={results.payments}>
            {results.payments.map((p) => (
              <Row key={p.id} to="/payments" title={p.reference || p.receipt_number} sub={`${p.tenant?.full_name} · ${p.rent_due?.period}`} right={<span className="text-sm font-semibold">{formatMoney(p.amount, currency)}</span>} />
            ))}
          </Section>
        </div>
      )}

      {results && !searching && Object.values(results).every((r) => !r || r.length === 0) && (
        <div className="card p-10 text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Aucun résultat pour « {query} »</p>
          <p className="mt-1 text-sm text-gray-400">Essayez un autre terme.</p>
        </div>
      )}

      {!query && !results && (
        <div className="card p-10 text-center text-sm text-gray-400">
          Recherchez dans toute votre base : maisons, locataires, logements, paiements.
        </div>
      )}
    </div>
  );
}
