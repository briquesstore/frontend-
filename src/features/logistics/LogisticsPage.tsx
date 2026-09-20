import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, MapPin, Calendar, Eye, Loader2, X, Clock, CheckCircle, AlertCircle, Package, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/core/utils/formatters';
import { logisticsApiService, type DeliveryRow, type DeliveryStatusFilter } from './logistics-api.service';
import { driversApiService, type Driver, type CreateDriverDto } from '../drivers/drivers-api.service';

type Tab = 'planning' | 'drivers' | 'zones';

const DELIVERY_STATUS: Record<string, { bg: string; text: string; label: string; icon?: React.ReactNode }> = {
  PENDING_ASSIGNMENT: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'À assigner', icon: <Package size={12} /> },
  ASSIGNED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Assignée', icon: <Clock size={12} /> },
  IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'En cours', icon: <Truck size={12} /> },
  ARRIVED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Arrivée', icon: <MapPin size={12} /> },
  CODE_VERIFIED: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Code vérifié', icon: <CheckCircle size={12} /> },
  DELIVERED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Livrée', icon: <CheckCircle size={12} /> },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Échouée', icon: <AlertCircle size={12} /> },
};

const STATUS_FILTERS: { value: DeliveryStatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING_ASSIGNMENT', label: 'À assigner' },
  { value: 'ASSIGNED', label: 'Assignées' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'DELIVERED', label: 'Livrées' },
  { value: 'FAILED', label: 'Échouées' },
];

interface AssignModalState {
  isOpen: boolean;
  delivery: DeliveryRow | null;
  selectedDriverId: string;
  scheduledAt: string;
  isSubmitting: boolean;
}

interface CreateDriverModalState {
  isOpen: boolean;
  formData: {
    phone: string;
    password: string;
    firstName: string;
    lastName: string;
    vehicleType: string;
    capacity: string;
    zones: string;
  };
  isSubmitting: boolean;
}

export default function LogisticsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('planning');
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatusFilter>('ALL');
  const [assignModal, setAssignModal] = useState<AssignModalState>({
    isOpen: false,
    delivery: null,
    selectedDriverId: '',
    scheduledAt: '',
    isSubmitting: false,
  });
  const [createDriverModal, setCreateDriverModal] = useState<CreateDriverModalState>({
    isOpen: false,
    formData: {
      phone: '',
      password: '',
      firstName: '',
      lastName: '',
      vehicleType: '',
      capacity: '',
      zones: '',
    },
    isSubmitting: false,
  });

  useEffect(() => {
    loadDeliveries();
    loadDrivers();
  }, [statusFilter]);

  const loadDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await logisticsApiService.getDeliveries(status);
      setDeliveries(data);
    } catch (err) {
      console.error('Erreur lors du chargement des livraisons:', err);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const data = await driversApiService.getActiveDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des livreurs:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const openAssignModal = (delivery: DeliveryRow) => {
    setAssignModal({
      isOpen: true,
      delivery,
      selectedDriverId: delivery.driverId || '',
      scheduledAt: delivery.scheduledAt ? new Date(delivery.scheduledAt).toISOString().slice(0, 16) : '',
      isSubmitting: false,
    });
  };

  const closeAssignModal = () => {
    setAssignModal({
      isOpen: false,
      delivery: null,
      selectedDriverId: '',
      scheduledAt: '',
      isSubmitting: false,
    });
  };

  const handleAssignSubmit = async () => {
    if (!assignModal.delivery || !assignModal.selectedDriverId) return;
    
    setAssignModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      await logisticsApiService.assignDriver(
        assignModal.delivery.id,
        assignModal.selectedDriverId,
        assignModal.scheduledAt || undefined
      );
      closeAssignModal();
      await loadDeliveries();
    } catch (err) {
      console.error('Erreur lors de l\'attribution du livreur:', err);
      alert('Erreur lors de l\'attribution du livreur');
      setAssignModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const openCreateDriverModal = () => {
    setCreateDriverModal({
      isOpen: true,
      formData: {
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        vehicleType: '',
        capacity: '',
        zones: '',
      },
      isSubmitting: false,
    });
  };

  const closeCreateDriverModal = () => {
    setCreateDriverModal({
      isOpen: false,
      formData: {
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        vehicleType: '',
        capacity: '',
        zones: '',
      },
      isSubmitting: false,
    });
  };

  const handleCreateDriverSubmit = async () => {
    const { formData } = createDriverModal;
    
    if (!formData.phone || !formData.password || !formData.firstName || !formData.lastName || !formData.vehicleType) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateDriverModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const createDto: CreateDriverDto = {
        phone: formData.phone,
        passwordHash: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        vehicleType: formData.vehicleType,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined,
        zones: formData.zones ? formData.zones.split(',').map(z => z.trim()) : [],
        isActive: true,
      };
      
      await driversApiService.createDriver(createDto);
      closeCreateDriverModal();
      await loadDrivers();
      alert('Livreur créé avec succès');
    } catch (err) {
      console.error('Erreur lors de la création du livreur:', err);
      alert('Erreur lors de la création du livreur');
      setCreateDriverModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const pendingCount = deliveries.filter((d) => d.status === 'PENDING_ASSIGNMENT').length;
  const inProgressCount = deliveries.filter((d) => ['ASSIGNED', 'IN_PROGRESS', 'ARRIVED', 'CODE_VERIFIED'].includes(d.status)).length;
  const deliveredCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
  const failedCount = deliveries.filter((d) => d.status === 'FAILED').length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistique</h1>
          <p className="text-sm text-gray-500 mt-1">Planning des livraisons, livreurs & zones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {([
          { key: 'planning' as Tab, label: 'Planning livraisons', icon: <Calendar size={16} /> },
          { key: 'drivers' as Tab, label: 'Livreurs', icon: <Users size={16} /> },
          { key: 'zones' as Tab, label: 'Zones & tarifs', icon: <MapPin size={16} /> },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-[#FF8C00] text-[#FF8C00]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Planning Tab */}
      {activeTab === 'planning' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setStatusFilter('PENDING_ASSIGNMENT')}
              className={cn(
                'bg-white rounded-xl border p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer',
                statusFilter === 'PENDING_ASSIGNMENT'
                  ? 'border-amber-400 ring-2 ring-amber-200/60 shadow-amber-50'
                  : 'border-gray-200/80 hover:border-amber-300'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">À assigner</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{pendingCount}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    En attente de chauffeur
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Package size={20} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={cn(
                'bg-white rounded-xl border p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer',
                statusFilter === 'IN_PROGRESS'
                  ? 'border-purple-400 ring-2 ring-purple-200/60 shadow-purple-50'
                  : 'border-gray-200/80 hover:border-purple-300'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">En cours</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{inProgressCount}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-purple-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                    Sur la route
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Truck size={20} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('DELIVERED')}
              className={cn(
                'bg-white rounded-xl border p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer',
                statusFilter === 'DELIVERED'
                  ? 'border-emerald-400 ring-2 ring-emerald-200/60 shadow-emerald-50'
                  : 'border-gray-200/80 hover:border-emerald-300'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Livrées</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{deliveredCount}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Remises aux clients
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('FAILED')}
              className={cn(
                'bg-white rounded-xl border p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer',
                statusFilter === 'FAILED'
                  ? 'border-red-400 ring-2 ring-red-200/60 shadow-red-50'
                  : 'border-gray-200/80 hover:border-red-300'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Échouées</span>
                  <p className="text-2xl font-bold text-red-600 mt-1">{failedCount}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    Nécessite assistance
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
              </div>
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                  statusFilter === f.value
                    ? 'bg-[#FF8C00] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loadingDeliveries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#FF8C00]" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucune livraison trouvée</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commande</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Lieu de livraison</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact sur place</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Livreur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date prévue</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => {
                      const st = DELIVERY_STATUS[d.status];
                      return (
                        <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <button onClick={() => navigate(`/admin/orders/${d.id}`)} className="text-sm font-semibold text-[#FF8C00] hover:underline">
                              {d.orderNumber}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{d.customerName}</p>
                            {d.phone && <p className="text-xs text-gray-500">{d.phone}</p>}
                          </td>
                          <td className="px-4 py-3 max-w-[250px]">
                            {d.projectName && (
                              <p className="text-sm font-medium text-gray-900">{d.projectName}</p>
                            )}
                            <p className="text-sm text-gray-600 truncate" title={d.address}>{d.address}</p>
                            {d.city && (
                              <p className="text-xs text-gray-500">{d.city}{d.commune ? `, ${d.commune}` : ''}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {d.contactName ? (
                              <div>
                                <p className="text-sm font-medium text-gray-900">{d.contactName}</p>
                                {d.contactPhone && <p className="text-xs text-gray-500">{d.contactPhone}</p>}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {d.driverName ? (
                              <div>
                                <p className="text-sm font-medium text-gray-900">{d.driverName}</p>
                                {d.driverPhone && <p className="text-xs text-gray-500">{d.driverPhone}</p>}
                              </div>
                            ) : (
                              <span className="text-sm text-yellow-600 font-medium">Non assigné</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {d.scheduledAt ? formatDateTime(d.scheduledAt) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {st && (
                              <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', st.bg, st.text)}>
                                {st.icon} {st.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openAssignModal(d)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#FF8C00] rounded-lg hover:bg-[#E67E00]"
                              >
                                <Truck size={14} /> {d.driverId ? 'Réassigner' : 'Assigner'}
                              </button>
                              <button
                                onClick={() => navigate(`/admin/orders/${d.id}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignModal.isOpen && assignModal.delivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Assigner un livreur</h3>
              <button onClick={closeAssignModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Commande</p>
                  <p className="text-lg font-semibold text-gray-900">{assignModal.delivery.orderNumber}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Client</p>
                  <p className="text-sm font-medium text-gray-900">{assignModal.delivery.customerName}</p>
                  {assignModal.delivery.phone && (
                    <p className="text-sm text-gray-600">{assignModal.delivery.phone}</p>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Lieu de livraison</p>
                  {assignModal.delivery.projectName && (
                    <p className="text-sm font-semibold text-[#FF8C00]">{assignModal.delivery.projectName}</p>
                  )}
                  <p className="text-sm text-gray-900">{assignModal.delivery.address}</p>
                  {assignModal.delivery.city && (
                    <p className="text-sm text-gray-600">
                      {assignModal.delivery.city}{assignModal.delivery.commune ? `, ${assignModal.delivery.commune}` : ''}
                    </p>
                  )}
                  {assignModal.delivery.landmarks && (
                    <p className="text-sm text-gray-500 italic mt-1">📍 {assignModal.delivery.landmarks}</p>
                  )}
                </div>
                {(assignModal.delivery.contactName || assignModal.delivery.contactPhone) && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 uppercase font-medium">Contact sur place</p>
                    {assignModal.delivery.contactName && (
                      <p className="text-sm font-medium text-gray-900">{assignModal.delivery.contactName}</p>
                    )}
                    {assignModal.delivery.contactPhone && (
                      <p className="text-sm text-gray-600">{assignModal.delivery.contactPhone}</p>
                    )}
                  </div>
                )}
                {assignModal.delivery.driverInstructions && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-xs text-gray-500 uppercase font-medium">Instructions livreur</p>
                    <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded mt-1">{assignModal.delivery.driverInstructions}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Livreur *</label>
                <select
                  value={assignModal.selectedDriverId}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, selectedDriverId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                  disabled={loadingDrivers}
                >
                  <option value="">Sélectionner un livreur</option>
                  {drivers.filter(d => d.isActive).map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName} - {driver.vehicleType || 'Véhicule non spécifié'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison prévue</label>
                <input
                  type="datetime-local"
                  value={assignModal.scheduledAt}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={!assignModal.selectedDriverId || assignModal.isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#FF8C00] rounded-lg hover:bg-[#E67E00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assignModal.isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {assignModal.delivery.driverId ? 'Réassigner' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Livreurs</h2>
            <button
              onClick={openCreateDriverModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#FF8C00] rounded-lg hover:bg-[#E67E00]"
            >
              <Plus size={16} /> Créer un livreur
            </button>
          </div>
          {loadingDrivers ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#FF8C00]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Livreur</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Téléphone</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Véhicule</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Capacité</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Zones</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">En cours</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <Truck size={14} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {d.firstName} {d.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{d.vehicleType || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.capacity ? `${d.capacity} kg` : '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {d.zones?.map((z: string) => (
                            <span key={z} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{z}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{d.orders?.length || 0}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold',
                          d.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
                        )}>
                          {d.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Zones Tab */}
      {activeTab === 'zones' && (
        <div className="bg-white rounded-xl border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MapPin size={32} className="text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900 mb-1">Zones de livraison</p>
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        </div>
      )}

      {/* Create Driver Modal */}
      {createDriverModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Créer un livreur</h3>
              <button onClick={closeCreateDriverModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={createDriverModal.formData.firstName}
                    onChange={(e) => setCreateDriverModal(prev => ({ ...prev, formData: { ...prev.formData, firstName: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={createDriverModal.formData.lastName}
                    onChange={(e) => setCreateDriverModal(prev => ({ ...prev, formData: { ...prev.formData, lastName: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                    placeholder="Kouassi"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  value={createDriverModal.formData.phone}
                  onChange={(e) => setCreateDriverModal(prev => ({ ...prev, formData: { ...prev.formData, phone: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                  placeholder="+225 07 00 00 00 00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  value={createDriverModal.formData.password}
                  onChange={(e) => setCreateDriverModal(prev => ({ ...prev, formData: { ...prev.formData, password: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">Le livreur utilisera ce mot de passe pour se connecter</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule *</label>
                <select
                  value={createDriverModal.formData.vehicleType}
                  onChange={(e) => setCreateDriverModal(prev => ({ ...prev, formData: { ...prev.formData, vehicleType: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                >
                  <option value="">Sélectionner</option>
                  <option value="Moto">Moto</option>
                  <option value="Camionnette">Camionnette</option>
                  <option value="Camion">Camion</option>
                  <option value="Fourgon">Fourgon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacité (kg)</label>
                <input
                  type="number"
                  value={createDriverModal.formData.capacity}
                  onChange={(e) => setCreateDriverModal(prev => ({ ...prev, formData: { ...prev.formData, capacity: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zones de livraison</label>
                <input
                  type="text"
                  value={createDriverModal.formData.zones}
                  onChange={(e) => setCreateDriverModal(prev => ({ ...prev, formData: { ...prev.formData, zones: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                  placeholder="Yopougon, Cocody, Plateau"
                />
                <p className="text-xs text-gray-500 mt-1">Séparez les zones par des virgules</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeCreateDriverModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateDriverSubmit}
                disabled={createDriverModal.isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#FF8C00] rounded-lg hover:bg-[#E67E00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createDriverModal.isSubmitting && <Loader2 size={16} className="animate-spin" />}
                <Save size={16} /> Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
