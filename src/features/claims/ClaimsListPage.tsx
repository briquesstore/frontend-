import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/core/utils/formatters';
import { CLAIM_TYPE_LABELS, CLAIM_STATUS_LABELS } from '@/core/types';
import { claimsApiService, type ClaimListItem } from './services/claims-api.service';

type Tab = 'all' | 'UNASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';

const STATUS_COLORS: Record<ClaimListItem['status'], { bg: string; text: string }> = {
  OPEN: { bg: 'bg-red-50', text: 'text-red-700' },
  IN_PROGRESS: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  RESOLVED: { bg: 'bg-green-50', text: 'text-green-700' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function ClaimsListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClaims = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await claimsApiService.getClaims({ pageSize: 100 });
      setClaims(response.data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des réclamations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const unassignedCount = claims.filter((c) => c.status === 'OPEN').length;

  const filtered = claims.filter((c) => {
    if (activeTab === 'UNASSIGNED') return c.status === 'OPEN';
    if (activeTab === 'IN_PROGRESS') return c.status === 'IN_PROGRESS';
    if (activeTab === 'RESOLVED') return c.status === 'RESOLVED' || c.status === 'CLOSED';
    if (search) {
      const q = search.toLowerCase();
      const orderText = c.orderNumber || c.preorderNumber || '';
      return (
        c.number.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        orderText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'UNASSIGNED', label: 'À traiter', count: unassignedCount },
    { key: 'IN_PROGRESS', label: 'En cours' },
    { key: 'RESOLVED', label: 'Résolues' },
    { key: 'all', label: 'Toutes' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Réclamations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {claims.length} réclamation(s) — {unassignedCount} à traiter
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
              activeTab === tab.key ? 'bg-[#FF8C00] text-white' : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                className={cn(
                  'ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold',
                  activeTab === tab.key ? 'bg-white/20' : 'bg-red-100 text-red-600',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative max-w-md mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par n°, client ou commande..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <button onClick={loadClaims} className="ml-auto text-red-500 hover:text-red-700">
            Réessayer
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Réclamation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commande</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Délai</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Chargement des réclamations…
                  </td>
                </tr>
              )}
              {!loading && filtered.map((c) => {
                const sc = STATUS_COLORS[c.status];
                const orderLink = c.orderId
                  ? `/admin/orders/${c.orderId}`
                  : c.preorderId
                  ? `/admin/preorders/${c.preorderId}`
                  : undefined;
                const orderText = c.orderNumber || c.preorderNumber || '-';
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(c.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.customerName}</td>
                    <td className="px-4 py-3">
                      {orderLink ? (
                        <button
                          onClick={() => navigate(orderLink)}
                          className="text-sm text-[#FF8C00] hover:underline font-medium"
                        >
                          {orderText}
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">{orderText}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{CLAIM_TYPE_LABELS[c.type]}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold', sc.bg, sc.text)}>
                        {CLAIM_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          c.daysSinceOpen > 2
                            ? 'text-red-600'
                            : c.daysSinceOpen > 0
                            ? 'text-yellow-600'
                            : 'text-gray-600',
                        )}
                      >
                        {c.daysSinceOpen === 0 ? "Aujourd'hui" : `${c.daysSinceOpen}j`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/admin/claims/${c.id}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#FF8C00] bg-orange-50 rounded-lg hover:bg-orange-100"
                      >
                        <Eye size={14} /> Voir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    Aucune réclamation trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
