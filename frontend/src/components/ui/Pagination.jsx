import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const pages = [];
  const current = meta.current_page;
  const last = meta.last_page;
  const start = Math.max(1, current - 2);
  const end = Math.min(last, current + 2);

  for (let i = start; i <= end; i++) pages.push(i);

  const btn = 'h-9 w-9 rounded-lg text-sm font-medium transition-colors flex items-center justify-center';

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Page {current} sur {last} · {meta.total} résultat(s)
      </p>
      <div className="flex items-center gap-1">
        <button
          className={`${btn} ${current === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          disabled={current === 1}
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {start > 1 && <span className="px-1 text-gray-400">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btn} ${p === current
              ? 'bg-brand-600 text-white'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}
          >
            {p}
          </button>
        ))}
        {end < last && <span className="px-1 text-gray-400">…</span>}
        <button
          className={`${btn} ${current === last ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          disabled={current === last}
          onClick={() => onPageChange(current + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
