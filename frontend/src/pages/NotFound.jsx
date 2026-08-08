import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-4 dark:bg-gray-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">404</h1>
      <p className="text-gray-500 dark:text-gray-400">Cette page n'existe pas ou a été déplacée.</p>
      <Link to="/" className="btn-primary mt-2">Retour au tableau de bord</Link>
    </div>
  );
}
