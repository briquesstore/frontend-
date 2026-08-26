import { useState, useEffect } from 'react';
import { Search, Plus, Truck, MapPin, Phone, Loader2, X, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { driversApiService, type Driver, type CreateDriverDto } from './drivers-api.service';

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

export default function DriversPage() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [total, setTotal] = useState(0);
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

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const response = await driversApiService.getDrivers({ page: 1, pageSize: 100 });
      setDrivers(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.firstName.toLowerCase().includes(search.toLowerCase()) ||
      driver.lastName.toLowerCase().includes(search.toLowerCase()) ||
      driver.phone?.includes(search),
  );

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Livreurs</h1>
          <p className="text-sm text-gray-500 mt-1">{total} livreur(s)</p>
        </div>
        <button onClick={openCreateDriverModal} className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#E67E00] font-medium">
          <Plus size={18} />
          Ajouter un livreur
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone ou email..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-[#FF8C00]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Livreur</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Véhicule</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Zones</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commandes</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF8C00]/10 flex items-center justify-center">
                          <Truck size={18} className="text-[#FF8C00]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {driver.firstName} {driver.lastName}
                          </p>
                          <p className="text-xs text-gray-400">{driver.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone size={14} className="text-gray-400" />
                        {driver.phone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{driver.vehicleType}</span>
                      {driver.capacity && (
                        <span className="text-xs text-gray-400 ml-1">({driver.capacity} kg)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {driver.zones && driver.zones.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {driver.zones.slice(0, 2).map((zone, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                            >
                              <MapPin size={12} />
                              {zone}
                            </span>
                          ))}
                          {driver.zones.length > 2 && (
                            <span className="text-xs text-gray-400">+{driver.zones.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold',
                          driver.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
                        )}
                      >
                        {driver.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {driver.orders?.length || 0}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <Truck size={32} className="text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-1">Aucun livreur trouvé</p>
                        <p className="text-sm text-gray-500">Essayez d'ajuster vos filtres de recherche</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
