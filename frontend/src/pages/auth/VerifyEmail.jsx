import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import { errorMessage } from '../../utils/format';

export default function VerifyEmail() {
  const toast = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyEmail(code);
      toast.success('Email vérifié avec succès !');
      navigate('/');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.info('Code renvoyé. Vérifiez votre email.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Vérification de l'email" subtitle="Saisissez le code à 6 chiffres envoyé à votre adresse email">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Code de vérification</label>
          <input
            className="input text-center text-2xl font-bold tracking-[0.5em]"
            placeholder="••••••"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading || code.length !== 6}>
          {loading ? 'Vérification…' : (<><ShieldCheck className="h-4 w-4" /> Vérifier mon email</>)}
        </button>
        <button type="button" onClick={resend} className="btn-ghost w-full" disabled={resending}>
          <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} /> Renvoyer le code
        </button>
      </form>
    </AuthLayout>
  );
}
