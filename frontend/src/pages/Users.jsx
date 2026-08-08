import { useEffect, useState } from 'react';
import { Plus, Search, ShieldCheck, Trash2, Pencil } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import { usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate, errorMessage } from '../utils/format';

const ROLES = [
  { value: 'super-admin', label: 'Super Admin', color: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400' },
  { value: 'gestionnaire', label: 'Gestionnaire', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' },
  { value: 'comptable', label: 'Comptable', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
];

const EMPTY = { name: '', email: '', password: '', password_confirmation: '', role: 'gestionnaire', phone: '', company_name: '' };

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersApi.all({ search: search || undefined, per_page: 15, page });
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [search, page]);

  const roleMeta = (role) => ROLES.find((r) => r.value === role) ?? ROLES[1];

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModalOpen(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, phone: u.phone || '', company_name: u.company_name || '', password: '', password_confirmation: '' });
    setErrors({});
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form };
      if (editing && !payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
      }
      if (editing) await usersApi.update(editing.id, payload);
      else await usersApi.create(payload);
      toast.success(editing ? 'Utilisateur mis à jour.' : 'Utilisateur créé.');
      setModalOpen(false);
      load();
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await usersApi.destroy(toDelete.id);
      toast.success('Utilisateur supprimé.');
      setConfirmOpen(false);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const field = (label, key_, type = 'text') => (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={form[key_]} onChange={(e) => setForm((f) => ({ ...f, [key_]: e.target.value }))} />
      {errors[key_] && <p className="mt-1 text-xs text-red-600">{errors[key_][0]}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gérez les comptes et leurs rôles (Super Admin, Gestionnaire, Comptable)"
        actions={<button className="btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Ajouter un utilisateur</button>}
      />

      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10" placeholder="Rechercher un utilisateur…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {loading && !data ? <PageLoader /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200/70 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                <tr>
                  <th className="th">Utilisateur</th>
                  <th className="th">Rôle</th>
                  <th className="th">Entreprise</th>
                  <th className="th">Créé le</th>
                  <th className="th">Statut</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(data?.data ?? []).map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/30">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                          {u.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{u.name} {u.id === me?.id && <span className="text-xs text-gray-400">(vous)</span>}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <span className={`badge ${roleMeta(u.role).color}`}><ShieldCheck className="h-3 w-3" /> {roleMeta(u.role).label}</span>
                    </td>
                    <td className="td">{u.company_name || '—'}</td>
                    <td className="td">{formatDate(u.created_at)}</td>
                    <td className="td">
                      <span className={`badge ${u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400'}`}>
                        {u.is_active ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800"><Pencil className="h-4 w-4" /></button>
                        {u.id !== me?.id && (
                          <button onClick={() => { setToDelete(u); setConfirmOpen(true); }} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"><Trash2 className="h-4 w-4" /></button>
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

      {data && <Pagination meta={data.meta} onPageChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Modifier ${editing.name}` : 'Nouvel utilisateur'} size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annuler</button>
            <button className="btn-primary" form="user-form" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </>
        }
      >
        <form id="user-form" onSubmit={submit} className="space-y-4">
          {field('Nom complet *', 'name')}
          {field('Email *', 'email', 'email')}
          <div className="grid grid-cols-2 gap-4">
            {field('Téléphone', 'phone')}
            <div>
              <label className="label">Rôle *</label>
              <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          {field('Entreprise', 'company_name')}
          <div className="grid grid-cols-2 gap-4">
            {field(editing ? 'Nouveau mot de passe' : 'Mot de passe *', 'password', 'password')}
            {field('Confirmation', 'password_confirmation', 'password')}
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={doDelete}
        title="Supprimer l'utilisateur" message={`Voulez-vous vraiment supprimer le compte de ${toDelete?.name ?? ''} ?`} />
    </div>
  );
}
