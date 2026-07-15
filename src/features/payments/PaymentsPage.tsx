import { useState, useEffect } from 'react';
import { Search, Download, CheckCircle, XCircle, Clock, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCFA, formatDateTime } from '@/core/utils/formatters';
import { paymentsApiService, PaymentStatus, OverdueInstallment, Payment } from './payments-api.service';

type Tab = 'all' | 'orders' | 'preorders' | 'overdue';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  CONFIRMED: { label: 'Confirmé', color: 'text-green-700', bg: 'bg-green-50', icon: <CheckCircle size={14} /> },
  PENDING: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-50', icon: <Clock size={14} /> },
  FAILED: { label: 'Échoué', color: 'text-red-700', bg: 'bg-red-50', icon: <XCircle size={14} /> },
  REFUNDED: { label: 'Remboursé', color: 'text-gray-700', bg: 'bg-gray-100', icon: <CreditCard size={14} /> },
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tous les paiements' },
  { key: 'orders', label: 'Commandes' },
  { key: 'preorders', label: 'Pré-commandes' },
  { key: 'overdue', label: 'Échéances impayées' },
];

export default function PaymentsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [overdueInstallments, setOverdueInstallments] = useState<OverdueInstallment[]>([]);
  const [totalConfirmed, setTotalConfirmed] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'overdue') {
      fetchOverdueInstallments();
    } else {
      fetchPayments();
    }
  }, [tab, search]);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const type = tab === 'orders' ? 'ORDER' : tab === 'preorders' ? 'PREORDER_INSTALLMENT' : undefined;
      const response = await paymentsApiService.getAllPayments({
        type,
        search: search || undefined,
        pageSize: 100,
      });
      setPayments(response.data);
      setTotalConfirmed(response.statistics.confirmedTotal);
      setTotalPending(response.statistics.pendingTotal);
      setTotalOverdue(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueInstallments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentsApiService.getOverdueInstallments();
      setOverdueInstallments(response.overdueInstallments);
      setTotalOverdue(response.totalOverdue);
      setTotalConfirmed(0);
      setTotalPending(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des échéances');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">Suivi des transactions et échéances</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download size={16} /> Exporter
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Paiements confirmés</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCFA(totalConfirmed)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Reste à payer (échéances)</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{formatCFA(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500">Échéances impayées</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCFA(totalOverdue)}</p>
          <p className="text-xs text-red-500 mt-1">{overdueInstallments.length} échéances en retard</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-4 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              tab === t.key ? 'bg-[#FF8C00] text-white' : 'text-gray-600 hover:bg-gray-100',
            )}
          >
            {t.label}
            {t.key === 'overdue' && overdueInstallments.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{overdueInstallments.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-[#FF8C00]" size={24} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && tab === 'overdue' ? (
        /* Overdue installments */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-semibold text-gray-900 text-sm">Échéances de pré-commandes en retard</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Pré-commande</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Échéance</th>
                <th className="text-right px-4 py-3">Montant</th>
                <th className="text-left px-4 py-3">Date due</th>
                <th className="text-left px-4 py-3">Retard</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overdueInstallments.map((o) => (
                <tr key={o.id} className="hover:bg-red-50/30">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.preorderNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{o.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{o.installmentLabel}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCFA(o.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(o.dueDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      {o.daysPastDue}j de retard
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs font-medium text-[#FF8C00] hover:underline">Relancer</button>
                  </td>
                </tr>
              ))}
              {overdueInstallments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Aucune échéance en retard
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Payments list */
        <>
          <div className="mb-4">
            <div className="relative w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par référence, client..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Référence</th>
                  <th className="text-left px-4 py-3">Commande</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-right px-4 py-3">Montant</th>
                  <th className="text-left px-4 py-3">Méthode</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => {
                  const cfg = STATUS_CONFIG[p.status];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.reference}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-gray-900">{p.orderNumber}</span>
                          {p.installmentLabel && (
                            <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{p.installmentLabel}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.customerName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCFA(p.amount)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.method}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(p.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
