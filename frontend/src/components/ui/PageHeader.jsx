import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, breadcrumb, actions }) {
  return (
    <div className="mb-6">
      {breadcrumb && (
        <nav className="mb-2 flex items-center gap-1 text-xs text-gray-400">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {item.to ? <Link to={item.to} className="hover:text-brand-600 dark:hover:text-brand-400">{item.label}</Link> : <span className="text-gray-500 dark:text-gray-300">{item.label}</span>}
              {i < breadcrumb.length - 1 && <ChevronRight className="h-3 w-3" />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
