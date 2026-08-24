import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, AlertTriangle, Loader2, CheckCircle2, ArrowRightCircle, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCFA, formatDate } from '@/core/utils/formatters';
import { preordersAdminApi, type Preorder } from './services/preorders-admin-api.service';

type PreorderStatusKey = Preorder['status'];

const STATUS_CONFIG: Record<PreorderStatusKey, { bg: string; text: string; label: string }> = {
  ACTIVE:    { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Active' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Terminée' },
  CONVERTED: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Convertie' },
  SUSPENDED: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Suspendue' },
  CANCELLED: { bg: 'bg-red-50',    text: 'text-red-700',    label: 'Annulée' },
};

type Tab = 'all' | PreorderStatusKey;

export default function PreordersListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [total, setTotal] = useState(0);

  const loadPreorders = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = activeTab !== 'all' ? activeTab : undefined;
      const response = await preordersAdminApi.getPreorders({ status: statusFilter, search: search || undefined });
      setPreorders(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading preorders:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    loadPreorders();
  }, [loadPreorders]);

  const tabs: { key: Tab; label: string; highlight?: boolean }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'ACTIVE', label: 'Actives' },
    { key: 'COMPLETED', label: 'À valider', highlight: true },
    { key: 'CONVERTED', label: 'Converties' },
    { key: 'SUSPENDED', label: 'Suspendues' },
    { key: 'CANCELLED', label: 'Annulées' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pré-commandes</h1>
          <p className="text-sm text-gray-500 mt-1">{total} pré-commande(s)</p>
        </div>
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
              tab.highlight && activeTab !== tab.key && 'text-[#FF8C00] font-bold',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par n° ou client..."
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qté</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Montant</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Progression</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prochaine échéance</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {preorders.map((row) => {
                  const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.ACTIVE;
                  const paidSchedules = row.schedules.filter((s) => s.status === 'PAID');
                  const totalSchedules = row.schedules.length;
                  const paidAmount = paidSchedules.reduce((sum, s) => sum + s.amount, 0);
                  const progress = totalSchedules > 0 ? Math.round((paidSchedules.length / totalSchedules) * 100) : 0;
                  const nextDue = row.schedules.find((s) => ['UPCOMING', 'DUE', 'OVERDUE'].includes(s.status));
                  const hasOverdue = row.schedules.some((s) => s.status === 'OVERDUE');

                  return (
                    <tr key={row.id} className={cn('border-b border-gray-50 hover:bg-gray-50/50', row.status === 'COMPLETED' && 'bg-emerald-50/30')}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{row.user.firstName} {row.user.lastName}</p>
                        <p className="text-xs text-gray-400">{row.user.phone || row.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{(row.totalQuantity ?? 0).toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCFA(row.totalAmount)}</p>
                        <p className="text-xs text-gray-400">Payé : {formatCFA(paidAmount)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                            <div
                              className={cn('h-full rounded-full', progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-[#FF8C00]' : 'bg-yellow-500')}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-12">{paidSchedules.length}/{totalSchedules}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {nextDue ? (
                          <div className="flex items-center gap-1">
                            {hasOverdue && <AlertTriangle size={14} className="text-red-500" />}
                            <div>
                              <p className="text-sm text-gray-900">{formatDate(nextDue.dueDate)}</p>
                              <p className="text-xs text-gray-400">{formatCFA(nextDue.amount)}</p>
                            </div>
                          </div>
                        ) : row.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 size={12} /> Tout payé
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold', cfg.bg, cfg.text)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {row.status === 'COMPLETED' && (
                            <button
                              onClick={() => navigate(`/admin/preorders/${row.id}`)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#FF8C00] rounded-lg hover:bg-[#E67E00]"
                            >
                              <ArrowRightCircle size={14} /> Valider
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/preorders/${row.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#FF8C00] bg-orange-50 rounded-lg hover:bg-orange-100"
                          >
                            <Eye size={14} /> Voir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {preorders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <ShoppingCart size={32} className="text-gray-400" />
                        </div>
                        <p className="text-base font-medium text-gray-900 mb-1">Aucune pré-commande trouvée</p>
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
    </div>
  );
}
