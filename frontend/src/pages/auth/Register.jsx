import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Building2, Phone, Mail, Lock } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', company_name: '', phone: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const data = await register(form);
      toast.success('Compte créé ! Vérifiez votre email.');
      if (data.email_verified === false) navigate('/verify-email');
      else navigate('/');
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const Field = ({ label, icon: Icon, type = 'text', key_, placeholder }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type={type} className="input pl-10" placeholder={placeholder} value={form[key_]} onChange={set(key_)} />
      </div>
      {errors[key_] && <p className="mt-1 text-xs text-red-600">{errors[key_][0]}</p>}
    </div>
  );

  return (
    <AuthLayout title="Créer un compte" subtitle="Commencez à gérer vos biens en quelques minutes">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nom complet" icon={UserPlus} key_="name" placeholder="Jean Dupont" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" type="email" icon={Mail} key_="email" placeholder="vous@exemple.com" />
          <Field label="Téléphone" icon={Phone} key_="phone" placeholder="+225 07 00 00 00 00" />
        </div>
        <Field label="Nom de l'entreprise / agence" icon={Building2} key_="company_name" placeholder="Agence Horizon" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Mot de passe" type="password" icon={Lock} key_="password" placeholder="••••••••" />
          <Field label="Confirmation" type="password" icon={Lock} key_="password_confirmation" placeholder="••••••••" />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Déjà inscrit ?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">Se connecter</Link>
      </p>
    </AuthLayout>
  );
}
