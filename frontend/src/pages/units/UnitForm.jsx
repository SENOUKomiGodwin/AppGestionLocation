import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { housesApi, unitsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

const TYPES = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'studio', label: 'Studio' },
  { value: 'commercial', label: 'Local commercial' },
  { value: 'bureau', label: 'Bureau' },
];

const STATUSES = [
  { value: 'libre', label: 'Libre' },
  { value: 'occupe', label: 'Occupé' },
  { value: 'renovation', label: 'En rénovation' },
];

export default function UnitForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const preHouse = location.state?.house_id;

  const [houses, setHouses] = useState([]);
  const [form, setForm] = useState({
    house_id: preHouse || '', number: '', type: 'appartement', bedrooms: 0,
    surface: '', rent_amount: '', deposit: '', status: 'libre',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    housesApi.all({ per_page: 100 }).then(({ data }) => {
      setHouses(data.data);
      setForm((f) => ({ ...f, house_id: f.house_id || data.data[0]?.id || '' }));
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    unitsApi.get(id).then(({ data }) => {
      const u = data.data;
      setForm({
        house_id: u.house_id, number: u.number, type: u.type, bedrooms: u.bedrooms,
        surface: u.surface, rent_amount: u.rent_amount, deposit: u.deposit, status: u.status,
      });
      setLoading(false);
    }).catch(() => { toast.error('Logement introuvable'); navigate('/units'); });
  }, [id, isEdit, navigate, toast]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        bedrooms: Number(form.bedrooms) || 0,
        surface: Number(form.surface) || 0,
        rent_amount: Number(form.rent_amount),
        deposit: Number(form.deposit) || 0,
      };
      if (isEdit) await unitsApi.update(id, payload);
      else await unitsApi.create(payload);
      toast.success(isEdit ? 'Logement mis à jour.' : 'Logement créé !');
      navigate('/units');
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key_, placeholder, type = 'text', step) => (
    <div>
      <label className="label">{label}</label>
      <input type={type} step={step} className="input" placeholder={placeholder} value={form[key_]} onChange={set(key_)} />
      {errors[key_] && <p className="mt-1 text-xs text-red-600">{errors[key_][0]}</p>}
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier le logement' : 'Nouveau logement'}
        breadcrumb={[{ label: 'Logements', to: '/units' }, { label: isEdit ? 'Modification' : 'Création' }]}
        actions={<button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Retour</button>}
      />

      <form onSubmit={submit} className="card max-w-3xl space-y-5 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Maison *</label>
            <select className="input" value={form.house_id} onChange={set('house_id')}>
              {houses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            {errors.house_id && <p className="mt-1 text-xs text-red-600">{errors.house_id[0]}</p>}
          </div>
          {field('Numéro *', 'number', 'A1')}
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={set('type')}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Statut</label>
            <select className="input" value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          {field('Chambres', 'bedrooms', '2', 'number')}
          {field('Surface (m²)', 'surface', '75', 'number', '0.01')}
          {field('Loyer mensuel *', 'rent_amount', '250000', 'number', '0.01')}
          {field('Caution', 'deposit', '500000', 'number', '0.01')}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-5 dark:border-gray-800">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : (<><Save className="h-4 w-4" /> {isEdit ? 'Enregistrer' : 'Créer le logement'}</>)}
          </button>
        </div>
      </form>
    </div>
  );
}
