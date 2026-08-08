import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Download, RefreshCw, FileText, Building2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { contractsApi, tenantsApi, unitsApi } from '../../api';
import { downloadFile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatMoney, formatDate, errorMessage } from '../../utils/format';

export default function ContractForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can, settings } = useAuth();
  const currency = settings.currency || 'EUR';

  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [contract, setContract] = useState(null);
  const [renewOpen, setRenewOpen] = useState(false);
  const [renewData, setRenewData] = useState({ duration_months: 12 });
  const [renewing, setRenewing] = useState(false);

  const [form, setForm] = useState({
    tenant_id: location.state?.tenant_id || '', unit_id: location.state?.house_id ? undefined : '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '', duration_months: 12, monthly_rent: '', deposit: '', billing_day: 1,
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    tenantsApi.all({ per_page: 100, active: true }).then(({ data }) => setTenants(data.data));
    unitsApi.all({ per_page: 100, status: 'libre' }).then(({ data }) => setUnits(data.data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    contractsApi.get(id).then(({ data }) => {
      const c = data.data;
      setContract(c);
      setForm({
        tenant_id: c.tenant_id, unit_id: c.unit_id,
        start_date: c.start_date, end_date: c.end_date,
        duration_months: c.duration_months, monthly_rent: c.monthly_rent,
        deposit: c.deposit, billing_day: c.billing_day,
      });
      setLoading(false);
    }).catch(() => { toast.error('Contrat introuvable'); navigate('/contracts'); });
  }, [id, isEdit, navigate, toast]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        duration_months: Number(form.duration_months) || 12,
        monthly_rent: Number(form.monthly_rent),
        deposit: Number(form.deposit) || 0,
        billing_day: Number(form.billing_day) || 1,
      };
      if (isEdit) await contractsApi.update(id, payload);
      else await contractsApi.create(payload);
      toast.success(isEdit ? 'Contrat mis à jour.' : 'Contrat créé ! PDF et échéances générés.');
      navigate('/contracts');
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    try {
      await downloadFile(`/contracts/${id}/download`, `contrat-${id}.pdf`);
      toast.success('Contrat téléchargé.');
    } catch {
      toast.error('Impossible de générer le PDF.');
    }
  };

  const renew = async () => {
    setRenewing(true);
    try {
      await contractsApi.renew(id, { duration_months: Number(renewData.duration_months) || 12 });
      toast.success('Contrat renouvelé !');
      setRenewOpen(false);
      navigate('/contracts');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setRenewing(false);
    }
  };

  const field = (label, key_, type = 'text', extra = {}) => (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" value={form[key_]} onChange={set(key_)} {...extra} />
      {errors[key_] && <p className="mt-1 text-xs text-red-600">{errors[key_][0]}</p>}
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title={isEdit ? `Contrat #${id}` : 'Nouveau contrat'}
        subtitle={isEdit && contract ? `${contract.tenant?.full_name} · ${formatMoney(contract.monthly_rent, currency)}/mois` : 'Créez un bail et générez automatiquement le PDF'}
        breadcrumb={[{ label: 'Contrats', to: '/contracts' }, { label: isEdit ? `Contrat #${id}` : 'Création' }]}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></button>
            {isEdit && contract?.status === 'active' && can('manage-contracts') && (
              <button className="btn-secondary" onClick={() => setRenewOpen(true)}><RefreshCw className="h-4 w-4" /> Renouveler</button>
            )}
            {isEdit && <button className="btn-secondary" onClick={download}><Download className="h-4 w-4" /> PDF</button>}
          </>
        }
      />

      {isEdit && contract && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge status={contract.status} />
          {contract.pdf_url && (
            <a href={contract.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
              <FileText className="h-4 w-4" /> Voir le PDF en ligne
            </a>
          )}
        </div>
      )}

      <form onSubmit={submit} className="card max-w-3xl space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Locataire *</label>
            <select className="input" value={form.tenant_id} onChange={set('tenant_id')} disabled={isEdit}>
              <option value="">— Choisir —</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
            {errors.tenant_id && <p className="mt-1 text-xs text-red-600">{errors.tenant_id[0]}</p>}
          </div>
          <div>
            <label className="label">Logement *</label>
            <select className="input" value={form.unit_id} onChange={set('unit_id')} disabled={isEdit}>
              <option value="">— Choisir —</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.display_name} · {formatMoney(u.rent_amount, currency)}</option>)}
            </select>
            {errors.unit_id && <p className="mt-1 text-xs text-red-600">{errors.unit_id[0]}</p>}
          </div>
          {field('Date d\'entrée *', 'start_date', 'date')}
          {field('Date de sortie *', 'end_date', 'date')}
          {field('Durée (mois)', 'duration_months', 'number', { min: 1 })}
          {field('Jour d\'échéance', 'billing_day', 'number', { min: 1, max: 28 })}
          {field('Loyer mensuel *', 'monthly_rent', 'number', { min: 0, step: '0.01' })}
          {field('Caution', 'deposit', 'number', { min: 0, step: '0.01' })}
        </div>

        {!isEdit && (
          <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 p-3.5 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-300">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
            <p>À la création, le contrat PDF est généré automatiquement, le logement passe en « occupé » et les échéances mensuelles sont créées.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : (<><Save className="h-4 w-4" /> {isEdit ? 'Enregistrer' : 'Créer le contrat'}</>)}
          </button>
        </div>
      </form>

      {/* Modal de renouvellement */}
      <Modal open={renewOpen} onClose={() => setRenewOpen(false)} title="Renouveler le contrat"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRenewOpen(false)}>Annuler</button>
            <button className="btn-primary" onClick={renew} disabled={renewing}><RefreshCw className={`h-4 w-4 ${renewing ? 'animate-spin' : ''}`} /> Renouveler</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800/50">
            <p className="text-gray-500">Le contrat actuel expirera le <strong>{contract && formatDate(contract.end_date)}</strong>.</p>
            <p className="mt-1 text-gray-500">Un nouveau contrat sera créé à partir de cette date, l'historique sera conservé.</p>
          </div>
          <div>
            <label className="label">Nouvelle durée (mois)</label>
            <input type="number" min="1" className="input" value={renewData.duration_months}
              onChange={(e) => setRenewData({ ...renewData, duration_months: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
