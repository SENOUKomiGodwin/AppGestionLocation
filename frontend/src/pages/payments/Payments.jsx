import { useEffect, useState } from 'react';
import { Wallet, FileDown, ReceiptText, Search, RefreshCw, Banknote, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { paymentsApi, rentDuesApi } from '../../api';
import { downloadFile } from '../../api/client';
import { useDebounce } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatMoney, errorMessage } from '../../utils/format';

const PERIODS = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= -1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
};

const METHODS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'carte', label: 'Carte' },
  { value: 'cheque', label: 'Chèque' },
];

export default function Payments() {
  const { can, settings } = useAuth();
  const toast = useToast();
  const currency = settings.currency || 'EUR';

  const [tab, setTab] = useState('dues');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const debounced = useDebounce(search);

  // Modal de paiement
  const [payDue, setPayDue] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'especes', reference: '', payment_date: new Date().toISOString().slice(0, 10) });
  const [paying, setPaying] = useState(false);
  const [payErrors, setPayErrors] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const params = { per_page: 15, page };
      if (tab === 'dues') {
        if (period) params.period = period;
        if (status) params.status = status;
        if (debounced) params.tenant_id = undefined;
        const res = await rentDuesApi.all(params);
        // filtre recherche côté client sur les dues
        let items = res.data.data;
        if (debounced) items = items.filter((d) => (d.tenant?.full_name || '').toLowerCase().includes(debounced.toLowerCase()));
        setData({ ...res.data, data: items });
      } else {
        if (debounced) params.period = undefined;
        const res = await paymentsApi.all({ ...params, period: debounced ? undefined : period, method: status || undefined });
        setData(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab, period, status, debounced, page]);

  const generate = async () => {
    setGenerating(true);
    try {
      const { data } = await rentDuesApi.generate();
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const openPay = (due) => {
    setPayDue(due);
    setPayForm({ amount: due.balance, method: 'especes', reference: '', payment_date: new Date().toISOString().slice(0, 10) });
    setPayErrors({});
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    setPayErrors({});
    try {
      const { data } = await paymentsApi.create({
        rent_due_id: payDue.id,
        amount: Number(payForm.amount),
        method: payForm.method,
        reference: payForm.reference || undefined,
        payment_date: payForm.payment_date,
      });
      toast.success(data.message);
      setPayDue(null);
      load();
    } catch (err) {
      setPayErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setPaying(false);
    }
  };

  const download = async (type, id, label) => {
    try {
      await downloadFile(type === 'invoice' ? `/invoices/${id}` : `/receipts/${id}`, label);
      toast.success('Document téléchargé.');
    } catch {
      toast.error('Téléchargement impossible.');
    }
  };

  const money = (v) => formatMoney(v, currency);

  return (
    <div>
      <PageHeader
        title="Loyers & Paiements"
        subtitle="Échéances mensuelles, encaissements, factures et reçus"
        actions={can('manage-payments') && (
          <button className="btn-secondary" onClick={generate} disabled={generating}>
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} /> Générer les échéances
          </button>
        )}
      />

      {/* Onglets */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800/70 w-fit">
        {[{ key: 'dues', label: 'Échéances' }, { key: 'payments', label: 'Paiements' }].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select className="input w-44" value={period} onChange={(e) => { setPeriod(e.target.value); setPage(1); }}>
          {PERIODS().map((p) => (
            <option key={p} value={p}>{new Date(`${p}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</option>
          ))}
        </select>
        {tab === 'dues' ? (
          <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="partial">Partiel</option>
            <option value="late">En retard</option>
            <option value="pending">Non payé</option>
          </select>
        ) : (
          <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Tous les modes</option>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        )}
        <div className="relative flex-1 min-w-56 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder={tab === 'dues' ? 'Filtrer par locataire…' : 'Rechercher un paiement…'} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
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
                  <th className="th">Montant</th>
                  {tab === 'dues' ? (<><th className="th">Payé</th><th className="th">Solde</th></>) : <th className="th">Mode</th>}
                  <th className="th">Statut</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.data ?? []).map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <td className="td font-semibold">{item.tenant?.full_name ?? '—'}</td>
                    <td className="td">{item.unit?.house?.name ? `${item.unit.house.name} · ${item.unit.number}` : (item.rent_due ? `Période ${item.rent_due.period}` : '—')}</td>
                    <td className="td">{item.period ?? (item.rent_due?.period ?? '—')}</td>
                    <td className="td font-semibold">{money(tab === 'dues' ? item.amount : item.amount)}</td>
                    {tab === 'dues' ? (
                      <>
                        <td className="td text-emerald-600 dark:text-emerald-400">{money(item.paid_amount)}</td>
                        <td className={`td font-semibold ${item.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>{money(item.balance)}</td>
                      </>
                    ) : (
                      <td className="td">{item.method_label}</td>
                    )}
                    <td className="td"><Badge status={item.status ?? 'paid'} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        {tab === 'dues' && item.balance > 0 && can('manage-payments') && (
                          <button onClick={() => openPay(item)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                            <Banknote className="h-3.5 w-3.5" /> Encaisser
                          </button>
                        )}
                        {tab === 'dues' && (
                          <button onClick={() => download('invoice', item.id, `facture-${item.period}.pdf`)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800" title="Facture PDF">
                            <FileDown className="h-4 w-4" />
                          </button>
                        )}
                        {tab === 'payments' && (
                          <button onClick={() => download('receipt', item.id, `recu-${item.receipt_number}.pdf`)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800" title="Reçu PDF">
                            <ReceiptText className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={tab === 'dues' ? <Wallet className="h-6 w-6" /> : <ReceiptText className="h-6 w-6" />}
          title={tab === 'dues' ? 'Aucune échéance' : 'Aucun paiement'}
          description={tab === 'dues' ? 'Générez les échéances ou changez de période.' : 'Enregistrez un paiement depuis l\'onglet Échéances.'} />
      )}

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      {/* Modal d'encaissement */}
      <Modal open={Boolean(payDue)} onClose={() => setPayDue(null)} title={`Encaisser — ${payDue?.tenant?.full_name ?? ''}`} size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setPayDue(null)}>Annuler</button>
            <button className="btn-primary" form="pay-form" type="submit" disabled={paying}>
              {paying ? 'Enregistrement…' : 'Enregistrer le paiement'}
            </button>
          </>
        }
      >
        {payDue && (
          <form id="pay-form" onSubmit={submitPayment} className="space-y-4">
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 text-center dark:bg-gray-800/50">
              <div><p className="text-xs text-gray-400">Dû</p><p className="font-bold">{money(payDue.amount)}</p></div>
              <div><p className="text-xs text-gray-400">Payé</p><p className="font-bold text-emerald-600">{money(payDue.paid_amount)}</p></div>
              <div><p className="text-xs text-gray-400">Solde</p><p className="font-bold text-red-600">{money(payDue.balance)}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Montant *</label>
                <input type="number" step="0.01" min="0.01" max={payDue.balance} className="input" value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} />
                {payErrors.amount && <p className="mt-1 text-xs text-red-600">{payErrors.amount[0]}</p>}
              </div>
              <div>
                <label className="label">Mode de paiement</label>
                <select className="input" value={payForm.method} onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}>
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Référence</label>
                <input className="input" placeholder="REF-001" value={payForm.reference} onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={payForm.payment_date} onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))} />
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-gray-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Le reçu PDF avec QR code sera généré automatiquement.
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
}
