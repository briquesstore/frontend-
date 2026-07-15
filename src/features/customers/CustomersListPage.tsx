import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCFA, formatDate } from '@/core/utils/formatters';
import { customersApiService, Customer } from './customers-api.service';

export default function CustomersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'PARTICULIER' | 'PROFESSIONNEL' | ''>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [search, typeFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersApiService.getCustomers({
        search: search || undefined,
        clientType: typeFilter || undefined,
        pageSize: 100,
      });
      setCustomers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} client(s)</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download size={16} /> Exporter
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone ou email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">Tous les types</option>
          <option value="PARTICULIER">Particulier</option>
          <option value="PROFESSIONNEL">Professionnel</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-[#FF8C00]" size={24} />
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Téléphone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commandes</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CA Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dernière cmd</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                    {c.companyName && <p className="text-xs text-gray-400">{c.companyName}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded',
                      c.clientType === 'PROFESSIONNEL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600',
                    )}>
                      {c.clientType === 'PROFESSIONNEL' ? 'PRO' : 'PART'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{c.totalOrders}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCFA(c.totalRevenue)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.lastOrderDate ? formatDate(c.lastOrderDate) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/admin/customers/${c.id}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#FF8C00] bg-orange-50 rounded-lg hover:bg-orange-100"
                    >
                      <Eye size={14} /> Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
