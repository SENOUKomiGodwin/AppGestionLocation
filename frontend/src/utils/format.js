/** Formate un montant selon la devise. */
export function formatMoney(amount, currency = 'EUR') {
  const value = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString('fr-FR')} ${currency}`;
  }
}

/** Formate une date ISO en jj/mm/aaaa. */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formate une date en forme longue : 12 mars 2026. */
export function formatDateLong(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Libellés et couleurs des statuts. */
export const STATUS_META = {
  // Logements
  libre: { label: 'Libre', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  occupe: { label: 'Occupé', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' },
  renovation: { label: 'En rénovation', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  // Échéances
  paid: { label: 'Payé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  partial: { label: 'Partiel', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  pending: { label: 'Non payé', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' },
  late: { label: 'En retard', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  // Contrats
  active: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  expire: { label: 'Expiré', color: 'bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400' },
  resilie: { label: 'Résilié', color: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' },
  renouvele: { label: 'Renouvelé', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400' },
};

export function statusMeta(status) {
  return STATUS_META[status] ?? { label: status ?? '—', color: 'bg-gray-100 text-gray-600' };
}

/** Initiales d'un nom. */
export function initialsOf(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();
}

/** Extrait la première erreur de validation d'une réponse Axios. */
export function errorMessage(err, fallback = 'Une erreur est survenue.') {
  const data = err?.response?.data;
  if (data?.message && typeof data.message === 'string') return data.message;
  if (data?.errors) {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first)) return first[0];
    if (typeof first === 'string') return first;
  }
  return fallback;
}
