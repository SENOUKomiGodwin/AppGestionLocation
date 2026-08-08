import { useState } from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Percent, Users, FileSpreadsheet, FileText } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import PageHeader from '../components/ui/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import StatCard from '../components/ui/StatCard';
import { analyticsApi } from '../api';
import { downloadFile } from '../api/client';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatMoney } from '../utils/format';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px', fontSize: '12px', color: '#f9fafb',
};

const PIE_COLORS = ['#ef4444', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#9ca3af'];

export default function Analytics() {
  const { settings } = useAuth();
  const toast = useToast();
  const currency = settings.currency || 'EUR';
  const [months, setMonths] = useState(12);
  const { data, loading } = useApi(() => analyticsApi.get({ months }), [months]);
  const [exporting, setExporting] = useState(null);

  if (loading || !data) return <PageLoader label="Calcul des statistiques…" />;
  const a = data.analytics;
  const money = (v) => formatMoney(v, currency);

  const CATEGORY_LABELS = {
    reparation: 'Réparations', eau: 'Eau', electricite: 'Électricité',
    entretien: 'Entretien', securite: 'Sécurité', autre: 'Autre',
  };
  const pieData = Object.entries(a.expenses_by_category || {}).map(([name, value]) => ({
    name: CATEGORY_LABELS[name] ?? name, value,
  }));

  const exportPdf = async () => {
    setExporting('pdf');
    try { await downloadFile(`/analytics/export/pdf?months=${months}`, 'rapport-analytics.pdf'); toast.success('Rapport PDF téléchargé.'); }
    catch { toast.error('Export impossible.'); } finally { setExporting(null); }
  };

  const exportExcel = async () => {
    setExporting('excel');
    try { await downloadFile(`/analytics/export/excel?months=${months}`, 'rapport-analytics.csv'); toast.success('Rapport Excel téléchargé.'); }
    catch { toast.error('Export impossible.'); } finally { setExporting(null); }
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Analyse de vos revenus, dépenses et performance locative"
        actions={
          <>
            <button className="btn-secondary" onClick={exportPdf} disabled={exporting}>
              <FileText className="h-4 w-4" /> {exporting === 'pdf' ? 'Export…' : 'PDF'}
            </button>
            <button className="btn-secondary" onClick={exportExcel} disabled={exporting}>
              <FileSpreadsheet className="h-4 w-4" /> {exporting === 'excel' ? 'Export…' : 'Excel'}
            </button>
          </>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Période :</label>
        <select className="input w-44" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          <option value={3}>3 derniers mois</option>
          <option value={6}>6 derniers mois</option>
          <option value={12}>12 derniers mois</option>
        </select>
        <span className="text-xs text-gray-400">Du {a.period.from} au {a.period.to}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={TrendingUp} label="Revenus" value={money(a.revenues)} color="emerald" />
        <StatCard icon={TrendingDown} label="Dépenses" value={money(a.expenses)} color="red" />
        <StatCard icon={PiggyBank} label="Bénéfices" value={money(a.profits)} color={a.profits >= 0 ? 'brand' : 'red'} />
        <StatCard icon={Percent} label="Taux de remplissage" value={`${a.occupancy_rate}%`} sub={`${a.occupied_units}/${a.total_units} logements`} color="sky" />
        <StatCard icon={Percent} label="Recouvrement" value={`${a.collection_rate}%`} sub={`${money(a.revenues)} / ${money(a.expected_revenues)} attendus`} color="violet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h3 className="mb-4 text-base font-semibold">Revenus, dépenses et bénéfices</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={a.monthly_profits || []} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={(v) => (v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [money(v), n === 'revenue' ? 'Revenus' : n === 'expense' ? 'Dépenses' : 'Bénéfices']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revG)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expG)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-base font-semibold">Dépenses par catégorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [money(v), 'Montant']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}
                </span>
                <span className="font-semibold">{money(d.value)}</span>
              </div>
            ))}
            {pieData.length === 0 && <p className="text-center text-sm text-gray-400">Aucune dépense</p>}
          </div>
        </div>
      </div>

      {/* Locataires en retard */}
      <div className="card mt-6 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4 text-red-500" /> Locataires en retard ({a.late_tenants?.length ?? 0})
        </h3>
        {a.late_tenants?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/70 dark:border-gray-800">
                <tr>
                  <th className="th">Locataire</th>
                  <th className="th">Périodes impayées</th>
                  <th className="th">Total dû</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {a.late_tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="td font-semibold">{t.name}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1.5">
                        {t.dues.map((d) => (
                          <span key={d.period} className="badge bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                            {d.period} · {money(d.balance)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="td font-bold text-red-600 dark:text-red-400">{money(t.total_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400">🎉 Aucun locataire en retard !</p>
        )}
      </div>
    </div>
  );
}
