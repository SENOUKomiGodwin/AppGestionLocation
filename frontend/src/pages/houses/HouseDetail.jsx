import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, Plus, MapPin, ArrowLeft, Building2, DoorOpen, Users } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import PageLoader from '../../components/ui/PageLoader';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { housesApi } from '../../api';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatMoney, formatDate, errorMessage } from '../../utils/format';

export default function HouseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can, settings } = useAuth();
  const currency = settings.currency || 'EUR';
  const { data, loading } = useApi(() => housesApi.get(id), [id]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading || !data) return <PageLoader />;
  const house = data.data;

  const destroy = async () => {
    setDeleting(true);
    try {
      await housesApi.destroy(house.id);
      toast.success('Maison supprimée.');
      navigate('/houses');
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={house.name}
        subtitle={house.address && (
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {house.address}{house.city ? `, ${house.city}` : ''}</span>
        )}
        breadcrumb={[{ label: 'Maisons', to: '/houses' }, { label: house.name }]}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></button>
            {can('manage-houses') && (
              <>
                <Link to={`/houses/${house.id}/edit`} className="btn-secondary"><Pencil className="h-4 w-4" /> Modifier</Link>
                <button className="btn-danger" onClick={() => setConfirmOpen(true)}><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Photo + infos */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            {house.photo ? (
              <img src={house.photo} alt={house.name} className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700">
                <Building2 className="h-16 w-16 text-white/40" />
              </div>
            )}
            <div className="space-y-2 p-5 text-sm">
              <p className="flex items-center justify-between"><span className="text-gray-400">Logements</span><strong>{house.number_of_units}</strong></p>
              <p className="flex items-center justify-between"><span className="text-gray-400">Occupés</span><strong className="text-emerald-600">{house.occupied_units}</strong></p>
              <p className="flex items-center justify-between"><span className="text-gray-400">Libres</span><strong className="text-sky-600">{house.free_units}</strong></p>
              <p className="flex items-center justify-between"><span className="text-gray-400">Créée le</span><strong>{formatDate(house.created_at)}</strong></p>
            </div>
          </div>
          {house.description && (
            <div className="card p-5">
              <h3 className="mb-2 text-sm font-semibold">Description</h3>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{house.description}</p>
            </div>
          )}
        </div>

        {/* Logements */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold"><DoorOpen className="h-4 w-4" /> Logements</h3>
            {can('manage-houses') && (
              <Link to="/units/new" state={{ house_id: house.id }} className="btn-secondary"><Plus className="h-4 w-4" /> Ajouter</Link>
            )}
          </div>

          <div className="space-y-3">
            {(house.units ?? []).map((unit) => (
              <Link key={unit.id} to={`/units/${unit.id}/edit`} className="card flex items-center justify-between p-4 transition-colors hover:border-brand-400/50">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {unit.number}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{unit.type_label}</p>
                    <p className="text-xs text-gray-400">{unit.bedrooms} ch. · {unit.surface} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatMoney(unit.rent_amount, currency)}</p>
                    {unit.current_tenant && (
                      <p className="flex items-center justify-end gap-1 text-xs text-gray-400"><Users className="h-3 w-3" /> {unit.current_tenant.full_name}</p>
                    )}
                  </div>
                  <Badge status={unit.status} />
                </div>
              </Link>
            ))}
            {house.units?.length === 0 && (
              <div className="card p-8 text-center text-sm text-gray-400">Aucun logement dans cette maison.</div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={destroy}
        loading={deleting}
        title="Supprimer la maison"
        message={`Voulez-vous vraiment supprimer « ${house.name} » ? Tous ses logements et données associées seront supprimés. Cette action est irréversible.`}
      />
    </div>
  );
}
