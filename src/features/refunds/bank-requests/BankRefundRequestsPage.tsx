import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, Eye, AlertTriangle, Clock, CheckCircle2, XCircle, Banknote } from 'lucide-react';
import { formatCFA } from '@/core/utils/formatters';
import { bankRefundApiService, type BankRefundRequest, type BankRefundQueryParams } from './services/bank-refund-api.service';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING_DOCUMENTS', label: 'En attente documents' },
  { value: 'PENDING_REVIEW', label: 'À traiter' },
  { value: 'IN_VERIFICATION', label: 'En vérification' },
  { value: 'APPROVED', label: 'Approuvé' },
  { value: 'REJECTED', label: 'Rejeté' },
  { value: 'PAID', label: 'Payé' },
  { value: 'CANCELLED_BY_USER', label: 'Annulé' },
];

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_DOCUMENTS: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'En attente documents' },
  PENDING_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'À traiter' },
  IN_VERIFICATION: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'En vérification' },
  APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approuvé' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejeté' },
  PAID: { bg: 'bg-green-50', text: 'text-green-700', label: 'Payé' },
  CANCELLED_BY_USER: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Annulé' },
};

const SLA_ICONS: Record<string, React.ReactNode> = {
  green: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  orange: <Clock className="h-4 w-4 text-orange-500" />,
  red: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

export default function BankRefundRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BankRefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BankRefundQueryParams>({
    status: '',
    page: 1,
    pageSize: 20,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bankRefundApiService.getAll(filters);
      setRequests(response.data);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value || undefined, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const pendingReviewCount = requests.filter((r) => r.status === 'PENDING_REVIEW').length;
  const urgentCount = requests.filter((r) => r.slaStatus === 'red' || r.slaStatus === 'orange').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Remboursements bancaires</h1>
          <p className="text-gray-600">
            Demandes de remboursement &gt; 500 000 FCFA
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-600">À traiter</div>
          <div className="text-2xl font-bold text-blue-600">{pendingReviewCount}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-600">Urgents (SLA)</div>
          <div className="text-2xl font-bold text-orange-600">{urgentCount}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-600">SLA</div>
          <div className="text-sm text-gray-600">5 jours ouvrés</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="w-64">
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="border rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-600">
            <XCircle className="mr-2 h-5 w-5" />
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Banknote className="h-12 w-12 mb-4" />
            <p>Aucune demande de remboursement bancaire</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Client</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">SLA</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Agent</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Créé le</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {request.user?.firstName} {request.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.user?.phone}
                        </div>
                        {request.isDiaspora && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs border rounded">
                            Diaspora
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCFA(request.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${STATUS_BADGES[request.status]?.bg} ${STATUS_BADGES[request.status]?.text}`}>
                        {STATUS_BADGES[request.status]?.label || request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {request.slaStatus && (
                        <div className="flex items-center gap-2">
                          {SLA_ICONS[request.slaStatus]}
                          <span className="text-sm">
                            {request.slaRemainingDays !== undefined
                              ? `${request.slaRemainingDays}j`
                              : '-'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {request.assignedAgent ? (
                        <span className="text-sm">
                          {request.assignedAgent.firstName} {request.assignedAgent.lastName}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Non assigné</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => navigate(`/refunds/bank-requests/${request.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {filters.page} sur {totalPages} ({total} résultats)
          </p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              disabled={filters.page === 1}
              onClick={() => handlePageChange((filters.page || 1) - 1)}
            >
              Précédent
            </button>
            <button
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
              disabled={filters.page === totalPages}
              onClick={() => handlePageChange((filters.page || 1) + 1)}
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
