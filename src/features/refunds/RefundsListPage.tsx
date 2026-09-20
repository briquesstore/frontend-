import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Loader2, AlertCircle, RotateCcw, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCFA, formatDateTime } from '@/core/utils/formatters';
import { REFUND_STATUS_LABELS, REFUND_STATUS_COLORS, REFUND_REASON_LABELS } from '@/core/types';
import { refundsApiService, type RefundListItem, type RefundsQuery } from './refunds-api.service';

type Tab = 'all' | 'MANUAL' | 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'APPROVED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'MANUAL', label: 'Manuels à traiter' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'PROCESSING', label: 'En cours' },
  { key: 'SUCCEEDED', label: 'Effectués' },
  { key: 'FAILED', label: 'Échoués' },
  { key: 'CANCELLED', label: 'Annulés' },
  { key: 'APPROVED', label: 'Approuvés' },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  MANUAL: <RotateCcw size={14} />,
  PENDING: <Clock size={14} />,
  PROCESSING: <Clock size={14} />,
  SUCCEEDED: <CheckCircle size={14} />,
  FAILED: <XCircle size={14} />,
  CANCELLED: <XCircle size={14} />,
  APPROVED: <CheckCircle size={14} />,
};

export default function RefundsListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [refunds, setRefunds] = useState<RefundListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRefunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const query: RefundsQuery = { pageSize: 100 };
      if (activeTab !== 'all') query.status = activeTab;
      const response = await refundsApiService.getRefunds(query);
      setRefunds(response.data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des remboursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, [activeTab]);

  const filtered = refunds.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.number.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.orderNumber && r.orderNumber.toLowerCase().includes(q)) ||
      (r.preorderNumber && r.preorderNumber.toLowerCase().includes(q))
    );
  });

  const manualCount = refunds.filter((r) => r.status === 'MANUAL' || r.status === 'PENDING').length;
  const totalAmount = filtered.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remboursements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {refunds.length} remboursement(s) — {manualCount} à traiter
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download size={16} /> Exporter
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Demandes à traiter</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{manualCount}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-orange-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                Action requise par l'équipe
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
              <RotateCcw size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Montant total filtré</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCFA(totalAmount)}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
                Sur les éléments affichés
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0">
              <Download size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remboursements listés</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filtered.length}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Dossiers répertoriés
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
              activeTab === t.key ? 'bg-[#FF8C00] text-white' : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {t.label}
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
          <button onClick={loadRefunds} className="ml-auto text-red-500 hover:text-red-700">
            Réessayer
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">N° Remboursement</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Commande</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Raison</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Chargement des remboursements…
                  </td>
                </tr>
              )}
              {!loading && filtered.map((r) => {
                const color = REFUND_STATUS_COLORS[r.status];
                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{r.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(r.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {r.orderNumber || r.preorderNumber || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{REFUND_REASON_LABELS[r.reason]}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCFA(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {STATUS_ICON[r.status]} {REFUND_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/admin/refunds/${r.id}`)}
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
                    Aucun remboursement trouvé
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
