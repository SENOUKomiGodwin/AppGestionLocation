import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmer la suppression', message, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Suppression…' : 'Supprimer'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-100 p-2 dark:bg-red-500/15">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </Modal>
  );
}
