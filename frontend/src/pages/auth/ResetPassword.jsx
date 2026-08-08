import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, KeyRound } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    token: params.get('token') ?? '',
    email: params.get('email') ?? '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await authApi.resetPassword(form);
      toast.success('Mot de passe réinitialisé. Connectez-vous !');
      navigate('/login');
    } catch (err) {
      setErrors(err.response?.data?.errors ?? {});
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un nouveau mot de passe pour votre compte">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Token</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" className="input pl-10" value={form.token} onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))} required />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email[0]}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="password" className="input pl-10" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password[0]}</p>}
          </div>
          <div>
            <label className="label">Confirmation</label>
            <input type="password" className="input" value={form.password_confirmation} onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))} required />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
        </button>
        <Link to="/login" className="block text-center text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Retour à la connexion</Link>
      </form>
    </AuthLayout>
  );
}
