import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, MapPin, Calendar, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/core/utils/formatters';
import { logisticsApiService, type DeliveryRow, type DriverRow } from './logistics-api.service';

type Tab = 'planning' | 'drivers' | 'zones';

const DELIVERY_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  ASSIGNED: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Assignée' },
  IN_PROGRESS: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'En cours' },
  ARRIVED: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Arrivée' },
  CODE_VERIFIED: { bg: 'bg-cyan-50', text: 'text-cyan-700', label: 'Code vérifié' },
  DELIVERED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Livrée' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Échouée' },
};

export default function LogisticsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('planning');
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [assigningDriver, setAssigningDriver] = useState<string | null>(null);

  useEffect(() => {
    loadDeliveries();
    loadDrivers();
  }, []);

  const loadDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const data = await logisticsApiService.getDeliveries();
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
      const data = await logisticsApiService.getDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Erreur lors du chargement des livreurs:', err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    setAssigningDriver(orderId);
    try {
      await logisticsApiService.assignDriver(orderId, driverId);
      await loadDeliveries(); // Recharger les livraisons après l'attribution
    } catch (err) {
      console.error('Erreur lors de l\'attribution du livreur:', err);
      alert('Erreur lors de l\'attribution du livreur');
    } finally {
      setAssigningDriver(null);
    }
  };

  const lateCount = deliveries.filter((d) => d.status === 'FAILED').length;

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
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Livraisons totales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{deliveries.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">En cours</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{deliveries.filter((d) => d.status === 'IN_PROGRESS').length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Complétées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{deliveries.filter((d) => d.status === 'DELIVERED').length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">En retard</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{lateCount}</p>
            </div>
          </div>

          {loadingDeliveries ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#FF8C00]" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commande</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Adresse</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Zone</th>
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
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.customerName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{d.address}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{d.zone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {assigningDriver === d.id ? (
                              <Loader2 size={16} className="animate-spin text-[#FF8C00]" />
                            ) : (
                              <select
                                value={d.driverId || ''}
                                onChange={(e) => handleAssignDriver(d.id, e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-[#FF8C00] outline-none"
                                disabled={loadingDrivers}
                              >
                                <option value="">Non assigné</option>
                                {drivers.map((driver) => (
                                  <option key={driver.id} value={driver.id}>
                                    {driver.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{d.scheduledAt ? formatDate(d.scheduledAt) : '-'}</td>
                          <td className="px-4 py-3 text-center">
                            {st && (
                              <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold', st.bg, st.text)}>
                                {st.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#FF8C00] bg-orange-50 rounded-lg hover:bg-orange-100">
                              <Eye size={14} /> Détails
                            </button>
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

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
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
                          <span className="text-sm font-medium text-gray-900">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{d.vehicleType || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{d.capacity || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {d.zones?.map((z) => (
                            <span key={z} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{z}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{d.currentDeliveries}</td>
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
    </div>
  );
}
