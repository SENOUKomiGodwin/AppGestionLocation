import { useEffect, useState } from 'react';
import { Plus, Search, ReceiptText, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { expensesApi, housesApi } from '../../api';
import { useDebounce } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatMoney, formatDate, errorMessage } from '../../utils/format';

const CATEGORIES = [
  { value: 'reparation', label: 'Réparations', color: 'bg-red-500' },
  { value: 'eau', label: 'Eau', color: 'bg-sky-500' },
  { value: 'electricite', label: 'Électricité', color: 'bg-amber-500' },
  { value: 'entretien', label: 'Entretien', color: 'bg-emerald-500' },
  { value: 'securite', label: 'Sécurité', color: 'bg-violet-500' },
  { value: 'autre', label: 'Autre', color: 'bg-gray-400' },
];

const EMPTY_FORM = { house_id: '', category: 'autre', amount: '', description: '', expense_date: new Date().toISOString().slice(0, 10) };

export default function Expenses() {
  const { can, settings } = useAuth();
  const toast = useToast();
  const currency = settings.currency || 'EUR';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounced = useDebounce(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    housesApi.all({ per_page: 100 }).then(({ data }) => setHouses(data.data));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.all({
        search: debounced || undefined, category: category || undefined,
        per_page: 15, page, sort: 'expense_date', direction: 'desc',
      });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [debounced, category, page]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setReceipt(null); setErrors({}); setModalOpen(true); };
  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      house_id: expense.house_id || '', category: expense.category, amount: expense.amount,
      description: expense.description || '', expense_date: expense.expense_date,
    });
    setReceipt(null);
    setErrors({});
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form, house_id: form.house_id || undefined, amount: Number(form.amount) };
      if (receipt) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => v !== undefined && fd.append(k, v));
        fd.append('receipt', receipt);
        if (editing) await expensesApi.update(editing.id, fd);
        else await expensesApi.create(fd);
      } else if (editing) {
        await expensesApi.update(editing.id, payload);
      } else {
        await expensesApi.create(payload);
      }
      toast.success(editing ? 'Dépense mise à jour.' : 'Dépense enregistrée.');
      setModalOpen(false);
      load();
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (expense) => { setToDelete(expense); setConfirmOpen(true); };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await expensesApi.destroy(toDelete.id);
      toast.success('Dépense supprimée.');
      setConfirmOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const catMeta = (value) => CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[5];

  return (
    <div>
      <PageHeader
        title="Dépenses"
        subtitle="Réparations, eau, électricité, entretien, sécurité"
        actions={can('manage-expenses') && <button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Nouvelle dépense</button>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-60 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Rechercher une dépense…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-48" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">Toutes les catégories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/70 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                <tr>
                  <th className="th">Date</th>
                  <th className="th">Catégorie</th>
                  <th className="th">Description</th>
                  <th className="th">Bien</th>
                  <th className="th">Montant</th>
                  {can('manage-expenses') && <th className="th text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.data ?? []).map((expense) => {
                  const meta = catMeta(expense.category);
                  return (
                    <tr key={expense.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                      <td className="td">{formatDate(expense.expense_date)}</td>
                      <td className="td">
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${meta.color}`} />
                          {expense.category_label}
                        </span>
                      </td>
                      <td className="td max-w-xs truncate">{expense.description || '—'}</td>
                      <td className="td">{expense.house?.name ?? '—'}</td>
                      <td className="td font-semibold">{formatMoney(expense.amount, currency)}</td>
                      {can('manage-expenses') && (
                        <td className="td">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(expense)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => confirmDelete(expense)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.data.length === 0 && (
        <EmptyState icon={<ReceiptText className="h-6 w-6" />} title="Aucune dépense" description="Enregistrez vos premières dépenses." />
      )}

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      {/* Modal formulaire */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier la dépense' : 'Nouvelle dépense'} size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
            <button className="btn-primary" form="expense-form" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </>
        }
      >
        <form id="expense-form" onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Catégorie *</label>
            <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Montant *</label>
              <input type="number" step="0.01" min="0.01" className="input" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount[0]}</p>}
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Bien (optionnel)</label>
            <select className="input" value={form.house_id} onChange={(e) => setForm((f) => ({ ...f, house_id: e.target.value }))}>
              <option value="">— Aucun —</option>
              {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20 resize-y" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Reçu (optionnel)</label>
            <input type="file" accept="image/*,.pdf" className="input" onChange={(e) => setReceipt(e.target.files?.[0] ?? null)} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={doDelete} loading={deleting}
        title="Supprimer la dépense" message="Voulez-vous vraiment supprimer cette dépense ?" />
    </div>
  );
}
