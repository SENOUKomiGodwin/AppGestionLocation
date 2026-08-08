import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Recevez un lien pour réinitialiser votre mot de passe">
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            Si cette adresse existe, un email de réinitialisation a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte de réception.
          </div>
          <Link to="/login" className="btn-secondary w-full"><ArrowLeft className="h-4 w-4" /> Retour à la connexion</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="email" className="input pl-10" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Envoi…' : (<><Send className="h-4 w-4" /> Envoyer le lien</>)}
          </button>
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
