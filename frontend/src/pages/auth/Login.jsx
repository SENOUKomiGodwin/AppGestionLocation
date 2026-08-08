import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const data = await login(form);
      toast.success('Connexion réussie. Bienvenue !');
      if (data.email_verified === false) {
        navigate('/verify-email');
      } else {
        navigate('/');
      }
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre tableau de bord de gestion locative">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="email" className="input pl-10" placeholder="vous@exemple.com" value={form.email} onChange={set('email')} />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>}
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="password" className="input pl-10" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password[0]}</p>}
        </div>
        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Mot de passe oublié ?
          </Link>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Connexion…' : (<><LogIn className="h-4 w-4" /> Se connecter</>)}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">Créer un compte</Link>
      </p>
      <div className="mt-4 rounded-xl bg-gray-50 p-3 text-center text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
        Démo : <code className="font-semibold">admin@immomanager.app</code> / <code className="font-semibold">password</code>
      </div>
    </AuthLayout>
  );
}
