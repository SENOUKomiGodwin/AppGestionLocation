import { statusMeta } from '../../utils/format';

export default function Badge({ status, label, className = '' }) {
  const meta = statusMeta(status);
  return (
    <span className={`badge ${meta.color} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? meta.label}
    </span>
  );
}
