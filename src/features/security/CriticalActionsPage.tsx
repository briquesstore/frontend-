import { useState, useEffect } from 'react';
import { Search, X, Loader2, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/core/utils/formatters';
import { criticalActionsApiService, type CriticalActionListItem } from './services/critical-actions-api.service';

type Tab = 'all' | 'PENDING' | 'APPROVED' | 'CANCELLED' | 'EXECUTED';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock },
  APPROVED: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CheckCircle },
  CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: XCircle },
  EXECUTED: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
  EXPIRED: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle },
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  CANCEL_PREORDER: 'Annulation pré-commande',
  CANCEL_ORDER: 'Annulation commande',
  UPDATE_PHONE: 'Changement de téléphone',
  UPDATE_EMAIL: 'Changement d\'email',
};

export default function CriticalActionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [actions, setActions] = useState<CriticalActionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelNotes, setCancelNotes] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const loadActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await criticalActionsApiService.getCriticalActions({ pageSize: 100 });
      setActions(response.data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des actions critiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, []);

  const pendingCount = actions.filter((a) => a.status === 'PENDING').length;
  const approvedCount = actions.filter((a) => a.status === 'APPROVED').length;

  const filtered = actions.filter((a) => {
    if (activeTab !== 'all' && a.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.userPhone.toLowerCase().includes(q) ||
        a.userEmail?.toLowerCase().includes(q) ||
        `${a.userFirstName} ${a.userLastName}`.toLowerCase().includes(q) ||
        ACTION_TYPE_LABELS[a.actionType]?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'PENDING', label: 'En attente', count: pendingCount },
    { key: 'APPROVED', label: 'Confirmées', count: approvedCount },
    { key: 'EXECUTED', label: 'Exécutées' },
    { key: 'CANCELLED', label: 'Annulées' },
    { key: 'all', label: 'Toutes' },
  ];

  const handleCancel = async () => {
    if (!cancellingId || !cancelNotes.trim()) return;
    
    try {
      await criticalActionsApiService.cancelCriticalAction(cancellingId, { notes: cancelNotes });
      setShowCancelDialog(false);
      setCancelNotes('');
      setCancellingId(null);
      loadActions();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Actions Critiques</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestion des actions sensibles nécessitant confirmation email et délai de 48h
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ID, téléphone, email, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {/* List */}
      {!loading && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Aucune action critique trouvée
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créée le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire le</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((action) => {
                  const statusConfig = STATUS_COLORS[action.status] as typeof STATUS_COLORS[keyof typeof STATUS_COLORS] || STATUS_COLORS.PENDING;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={action.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {action.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {ACTION_TYPE_LABELS[action.actionType] || action.actionType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>{action.userFirstName} {action.userLastName}</div>
                        <div className="text-xs text-gray-500">{action.userPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusConfig.bg, statusConfig.text)}>
                          <StatusIcon className="h-3 w-3" />
                          {action.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDateTime(action.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDateTime(action.expiresAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(action.status === 'PENDING' || action.status === 'APPROVED') && (
                          <button
                            onClick={() => {
                              setCancellingId(action.id);
                              setShowCancelDialog(true);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Annuler
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Annuler l'action critique</h2>
            <p className="text-sm text-gray-600 mb-4">
              Veuillez indiquer la raison de l'annulation (obligatoire pour l'audit).
            </p>
            <textarea
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
              placeholder="Raison de l'annulation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelNotes('');
                  setCancellingId(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelNotes.trim()}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
