import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Camera, FileText } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import { tenantsApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

export default function TenantForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '', profession: '',
    birth_date: '', nationality: '', id_number: '',
    emergency_contact_name: '', emergency_contact_phone: '', notes: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [idPhoto, setIdPhoto] = useState(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    tenantsApi.get(id).then(({ data }) => {
      const t = data.data;
      setForm({
        first_name: t.first_name, last_name: t.last_name, phone: t.phone || '', email: t.email || '',
        profession: t.profession || '', birth_date: t.birth_date || '', nationality: t.nationality || '',
        id_number: t.id_number || '', emergency_contact_name: t.emergency_contact_name || '',
        emergency_contact_phone: t.emergency_contact_phone || '', notes: t.notes || '',
      });
      if (t.photo) setPhotoPreview(t.photo);
      if (t.id_photo) setIdPhotoPreview(t.id_photo);
      setLoading(false);
    }).catch(() => { toast.error('Locataire introuvable'); navigate('/tenants'); });
  }, [id, isEdit, navigate, toast]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onFile = (setter, previewSetter) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      if (photo) fd.append('photo', photo);
      if (idPhoto) fd.append('id_photo', idPhoto);

      if (isEdit) await tenantsApi.update(id, fd);
      else await tenantsApi.create(fd);
      toast.success(isEdit ? 'Locataire mis à jour.' : 'Locataire créé !');
      navigate('/tenants');
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key_, placeholder, type = 'text', half = true) => (
    <div className={half ? '' : 'sm:col-span-2'}>
      <label className="label">{label}</label>
      <input type={type} className="input" placeholder={placeholder} value={form[key_]} onChange={set(key_)} />
      {errors[key_] && <p className="mt-1 text-xs text-red-600">{errors[key_][0]}</p>}
    </div>
  );

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Modifier le locataire' : 'Nouveau locataire'}
        breadcrumb={[{ label: 'Locataires', to: '/tenants' }, { label: isEdit ? 'Modification' : 'Création' }]}
        actions={<button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /> Retour</button>}
      />

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-5 p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Informations personnelles</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {field('Prénom *', 'first_name', 'Koffi')}
            {field('Nom *', 'last_name', 'Konan')}
            {field('Téléphone', 'phone', '+225 07 00 00 00 00')}
            {field('Email', 'email', 'koffi@exemple.com', 'email')}
            {field('Profession', 'profession', 'Ingénieur')}
            {field('Date de naissance', 'birth_date', '', 'date')}
            {field('Nationalité', 'nationality', 'Ivoirienne')}
            {field('N° CNI / Passeport', 'id_number', 'C-123456')}
          </div>

          <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Contact d'urgence</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {field('Personne à contacter', 'emergency_contact_name', 'Marie Konan')}
            {field('Téléphone', 'emergency_contact_phone', '+225 01 00 00 00 00')}
          </div>

          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-24 resize-y" placeholder="Remarques…" value={form.notes} onChange={set('notes')} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <label className="label">Photo du locataire</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 dark:border-gray-700">
              {photoPreview ? <img src={photoPreview} className="h-32 w-32 rounded-full object-cover" /> : <Camera className="h-7 w-7 text-gray-400" />}
              <span className="text-xs text-gray-400">Photo de profil</span>
              <input type="file" accept="image/*" className="hidden" onChange={onFile(setPhoto, setPhotoPreview)} />
            </label>
          </div>
          <div className="card p-6">
            <label className="label">Photo CNI / Passeport</label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-brand-500 dark:border-gray-700">
              {idPhotoPreview ? <img src={idPhotoPreview} className="h-28 w-full rounded-xl object-cover" /> : <FileText className="h-7 w-7 text-gray-400" />}
              <span className="text-xs text-gray-400">Pièce d'identité</span>
              <input type="file" accept="image/*" className="hidden" onChange={onFile(setIdPhoto, setIdPhotoPreview)} />
            </label>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Enregistrement…' : (<><Save className="h-4 w-4" /> {isEdit ? 'Enregistrer' : 'Créer le locataire'}</>)}
          </button>
        </div>
      </form>
    </div>
  );
}
