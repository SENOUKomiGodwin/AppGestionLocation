import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Aucune donnée', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="rounded-2xl bg-gray-100 p-4 dark:bg-gray-800">
        <Inbox className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
