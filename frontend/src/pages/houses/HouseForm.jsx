import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, ImagePlus } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { housesApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

export default function HouseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '', address: '', city: '', description: '', number_of_units: 0,
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    housesApi.get(id).then(({ data }) => {
      const h = data.data;
      setForm({
        name: h.name, address: h.address, city: h.city || '',
        description: h.description || '', number_of_units: h.number_of_units,
      });
      if (h.photo) setPhotoPreview(h.photo);
      setLoading(false);
    }).catch(() => { setLoading(false); toast.error('Maison introuvable'); navigate('/houses'); });
  }, [id, isEdit, navigate, toast]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = { ...form, number_of_units: Number(form.number_of_units) };
      if (photo) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, v));
        fd.append('photo', photo);
        if (isEdit) await housesApi.update(id, fd);
        else await housesApi.create(fd);
      } else if (isEdit) {
        await housesApi.update(id, payload);
      } else {
        await housesApi.create(payload);
      }
      toast.success(isEdit ? 'Maison mise à jour.' : 'Maison créée !');
      navigate(isEdit ? `/houses/${id}` : '/houses');
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key_, placeholder, type = 'text') => (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input" placeholder={placeholder} value={form[key_]} onChange={set(key_)} />
      {errors[key_] && <p className="mt-1 text-xs text-red-600">{errors[key_][0]}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier la maison' : 'Nouvelle maison'}
        breadcrumb={[{ label: 'Maisons', to: '/houses' }, { label: isEdit ? 'Modification' : 'Création' }]}
        actions={<button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Retour</button>}
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-5 p-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {field('Nom de la maison *', 'name', 'Résidence Azur')}
            {field('Ville', 'city', 'Abidjan')}
          </div>
          {field('Adresse *', 'address', '12 Boulevard de la Corniche')}
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-28 resize-y" placeholder="Décrivez la maison, ses équipements…" value={form.description} onChange={set('description')} />
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {field('Nombre de logements', 'number_of_units', '8', 'number')}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <label className="label">Photo de la maison</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-brand-500 dark:border-gray-700">
              {photoPreview ? (
                <img src={photoPreview} alt="Aperçu" className="h-40 w-full rounded-xl object-cover" />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Cliquez pour télécharger une photo</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving || loading}>
            {saving ? 'Enregistrement…' : (<><Save className="h-4 w-4" /> {isEdit ? 'Enregistrer' : 'Créer la maison'}</>)}
          </button>
        </div>
      </form>
    </div>
  );
}
