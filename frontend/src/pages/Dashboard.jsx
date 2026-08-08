import {
  Building2, DoorOpen, Users, Wallet, AlertTriangle, TrendingUp, CalendarDays, Home,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { useApi } from '../hooks/useApi';
import { dashboardApi } from '../api';
import StatCard from '../components/ui/StatCard';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../utils/format';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#f9fafb',
};

export default function Dashboard() {
  const { settings } = useAuth();
  const currency = settings.currency || 'EUR';
  const { data, loading } = useApi(() => dashboardApi.stats());

  if (loading || !data) return <PageLoader label="Chargement du tableau de bord…" />;

  const s = data.stats;
  const money = (v) => formatMoney(v, currency);

  const paymentData = (s.payments_by_month || []).map((m) => ({
    ...m,
    attendu: m.expected,
    encaisse: m.paid,
  }));

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Vue d'ensemble de votre patrimoine locatif — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard icon={Building2} label="Maisons" value={s.houses} color="brand" index={0} />
        <StatCard icon={DoorOpen} label="Logements" value={s.units} sub={`${s.free_units} libres · ${s.occupied_units} occupés`} color="sky" index={1} />
        <StatCard icon={Users} label="Locataires" value={s.tenants} color="violet" index={2} />
        <StatCard icon={Home} label="Taux d'occupation" value={`${s.occupancy_rate}%`} color="emerald" index={3} />
        <StatCard icon={Wallet} label="Loyers encaissés" value={money(s.collected_rents)} color="emerald" index={4} />
        <StatCard icon={AlertTriangle} label="Loyers impayés" value={money(s.unpaid_rents)} sub={`${s.late_dues} en retard`} color="red" index={5} />
        <StatCard icon={TrendingUp} label="Revenus du mois" value={money(s.monthly_revenue)} color="brand" index={6} />
        <StatCard icon={CalendarDays} label="Revenus annuels" value={money(s.annual_revenue)} color="sky" index={7} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Revenus mensuels */}
        <div className="card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revenus mensuels</h3>
              <p className="text-xs text-gray-400">12 derniers mois</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Encaissés</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s.monthly_revenue_series || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [money(v), 'Encaissé']} />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Paiements par mois */}
        <div className="card p-6">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Paiements par mois</h3>
            <p className="text-xs text-gray-400">Attendu vs encaissé</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="attendu" fill="#c7d2fe" radius={[6, 6, 0, 0]} maxBarSize={18} />
                <Bar dataKey="encaisse" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statuts d'échéances */}
      <div className="card p-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Synthèse des loyers</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatusItem label="Total encaissé" value={money(s.collected_rents)} color="bg-emerald-500" />
          <StatusItem label="Total impayé" value={money(s.unpaid_rents)} color="bg-red-500" />
          <StatusItem label="Échéances en retard" value={s.late_dues} color="bg-red-400" />
          <StatusItem label="Échéances en attente" value={s.pending_dues} color="bg-gray-400" />
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, color = 'bg-emerald-500' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
