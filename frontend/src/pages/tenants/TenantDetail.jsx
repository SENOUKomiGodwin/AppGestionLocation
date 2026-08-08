import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, ArrowLeft, Phone, Mail, Briefcase, CalendarDays, FileText, IdCard, UserRound } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { tenantsApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatMoney, formatDate, errorMessage } from '../../utils/format';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can, settings } = useAuth();
  const currency = settings.currency || 'EUR';
  const { data, loading } = useApi(() => tenantsApi.get(id), [id]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading || !data) return <PageLoader />;
  const tenant = data.data;
  const activeContract = tenant.active_contract;

  const destroy = async () => {
    setDeleting(true);
    try {
      await tenantsApi.destroy(tenant.id);
      toast.success('Locataire supprimé.');
      navigate('/tenants');
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 text-gray-400" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={tenant.full_name}
        subtitle={`${tenant.profession || ''}${tenant.nationality ? ` · ${tenant.nationality}` : ''}`}
        breadcrumb={[{ label: 'Locataires', to: '/tenants' }, { label: tenant.full_name }]}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></button>
            {can('manage-tenants') && (
              <>
                <Link to={`/tenants/${tenant.id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> Modifier</Link>
                <button className="btn-danger" onClick={() => setConfirmOpen(true)}><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="flex flex-col items-center bg-gradient-to-b from-brand-50 to-transparent p-6 dark:from-brand-500/10">
              {tenant.photo ? (
                <img src={tenant.photo} alt={tenant.full_name} className="h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-800" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white ring-4 ring-white dark:ring-gray-800">{tenant.initials}</div>
              )}
              <h2 className="mt-3 text-lg font-bold">{tenant.full_name}</h2>
              {activeContract && <Badge status="active" label="Locataire actif" className="mt-1" />}
            </div>
            <div className="divide-y divide-gray-100 px-5 dark:divide-gray-800">
              <InfoRow icon={Phone} label="Téléphone" value={tenant.phone} />
              <InfoRow icon={Mail} label="Email" value={tenant.email} />
              <InfoRow icon={Briefcase} label="Profession" value={tenant.profession} />
              <InfoRow icon={CalendarDays} label="Date de naissance" value={formatDate(tenant.birth_date)} />
              <InfoRow icon={IdCard} label="N° CNI / Passeport" value={tenant.id_number} />
            </div>
            {tenant.id_photo && (
              <div className="p-5">
                <p className="mb-2 text-xs text-gray-400">Pièce d'identité</p>
                <img src={tenant.id_photo} alt="CNI" className="w-full rounded-xl border border-gray-200 dark:border-gray-700" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Contrat actif */}
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold"><FileText className="h-4 w-4" /> Contrat actif</h3>
              {can('manage-contracts') && !activeContract && (
                <Link to="/contracts/new" state={{ tenant_id: tenant.id }} className="btn-primary"><FileText className="h-4 w-4" /> Créer un contrat</Link>
              )}
            </div>
            {activeContract ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail label="Logement" value={`${activeContract.unit?.house?.name} · ${activeContract.unit?.number}`} />
                <Detail label="Loyer mensuel" value={formatMoney(activeContract.monthly_rent, currency)} />
                <Detail label="Entrée" value={formatDate(activeContract.start_date)} />
                <Detail label="Sortie" value={formatDate(activeContract.end_date)} />
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun contrat actif pour ce locataire.</p>
            )}
          </div>

          {/* Historique des contrats */}
          <div className="card p-6">
            <h3 className="mb-4 text-base font-semibold">Historique des contrats</h3>
            <div className="space-y-3">
              {(tenant.contracts ?? []).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                  <div>
                    <p className="text-sm font-semibold">{contract.unit?.house?.name} · Logement {contract.unit?.number}</p>
                    <p className="text-xs text-gray-400">{formatDate(contract.start_date)} → {formatDate(contract.end_date)} · {formatMoney(contract.monthly_rent, currency)}/mois</p>
                  </div>
                  <Badge status={contract.status} />
                </div>
              ))}
              {(tenant.contracts ?? []).length === 0 && <p className="text-sm text-gray-400">Aucun contrat.</p>}
            </div>
          </div>

          {/* Contact d'urgence */}
          {(tenant.emergency_contact_name || tenant.emergency_contact_phone) && (
            <div className="card p-6">
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold"><UserRound className="h-4 w-4" /> Contact d'urgence</h3>
              <p className="text-sm font-medium">{tenant.emergency_contact_name}</p>
              <p className="text-sm text-gray-400">{tenant.emergency_contact_phone}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={destroy}
        loading={deleting}
        title="Supprimer le locataire"
        message={`Voulez-vous vraiment supprimer « ${tenant.full_name} » ? Ses contrats seront également supprimés.`}
      />
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/50">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
