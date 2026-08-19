import { useEffect, useState } from 'react';
import { Save, Building2, Globe, Coins, Upload } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import PageLoader from '../components/ui/PageLoader';
import { settingsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, formatMoney, CURRENCIES } from '../utils/format';

export default function Settings() {
  const { setSettings, reload } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsApi.get().then(({ data }) => {
      setForm(data.settings);
      setLoading(false);
    });
  }, []);

  if (loading || !form) return <PageLoader />;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await settingsApi.update(form);
      setForm(data.settings);
      setSettings(data.settings);
      await reload();
      toast.success('Paramètres enregistrés.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const { data } = await settingsApi.uploadLogo(fd);
      setForm(data.settings);
      setSettings(data.settings);
      toast.success('Logo mis à jour.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Personnalisez votre espace de travail" />

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-5 p-6 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
            <Building2 className="h-4 w-4" /> Entreprise
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Nom de l'entreprise</label>
              <input className="input" value={form.company_name ?? ''} onChange={set('company_name')} />
            </div>
            <div>
              <label className="label">Email de contact</label>
              <input type="email" className="input" value={form.company_email ?? ''} onChange={set('company_email')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresse</label>
              <input className="input" value={form.company_address ?? ''} onChange={set('company_address')} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="input" value={form.company_phone ?? ''} onChange={set('company_phone')} />
            </div>
          </div>

          <h3 className="flex items-center gap-2 pt-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
            <Globe className="h-4 w-4" /> Préférences
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label className="label flex items-center gap-1.5"><Coins className="h-3.5 w-3.5" /> Devise</label>
              <select className="input" value={form.currency ?? 'EUR'} onChange={set('currency')}>
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>)}
              </select>
              <p className="mt-1.5 text-xs text-gray-400">
                Aperçu : {formatMoney(250000, form.currency ?? 'EUR')}
              </p>
            </div>
            <div>
              <label className="label">Langue</label>
              <select className="input" value={form.language ?? 'fr'} onChange={set('language')}>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="label">Rappel avant échéance (jours)</label>
              <input type="number" min="0" max="30" className="input" value={form.payment_due_reminder_days ?? 3} onChange={set('payment_due_reminder_days')} />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : (<><Save className="h-4 w-4" /> Enregistrer</>)}
            </button>
          </div>
        </div>

        <div className="card h-fit p-6">
          <h3 className="mb-4 text-sm font-semibold">Logo de l'entreprise</h3>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-brand-500 dark:border-gray-700">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="h-24 w-24 rounded-2xl object-contain" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 text-white"><Building2 className="h-9 w-9" /></div>
            )}
            <span className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"><Upload className="h-4 w-4" /> Changer le logo</span>
            <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
          </label>
          <p className="mt-3 text-center text-xs text-gray-400">PNG, JPG, SVG · max 5 Mo</p>
        </div>
      </form>
    </div>
  );
}
