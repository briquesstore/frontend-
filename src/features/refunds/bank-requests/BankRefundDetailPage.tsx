import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Eye, CheckCircle2, XCircle, DollarSign, FileText, User, Calendar, AlertCircle } from 'lucide-react';
import { formatCFA, formatDate } from '@/core/utils/formatters';
import { bankRefundApiService, type BankRefundRequest, type ChecklistItem, type ApproveDto, type RejectDto, type MarkPaidDto } from './services/bank-refund-api.service';

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_DOCUMENTS: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'En attente documents' },
  PENDING_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'À traiter' },
  IN_VERIFICATION: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'En vérification' },
  APPROVED: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approuvé' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejeté' },
  PAID: { bg: 'bg-green-50', text: 'text-green-700', label: 'Payé' },
  CANCELLED_BY_USER: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Annulé' },
};

export default function BankRefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BankRefundRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [checklist, setChecklist] = useState<(ChecklistItem & { checked: boolean })[]>([]);
  
  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  
  // Form states
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [paidReference, setPaidReference] = useState('');
  const [paidNotes, setPaidNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchRequest();
      fetchChecklist();
    }
  }, [id]);

  const fetchRequest = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await bankRefundApiService.getById(id);
      setRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklist = async () => {
    try {
      const data = await bankRefundApiService.getChecklist();
      setChecklist(data.checklist.map(item => ({ ...item, checked: false as boolean })));
    } catch (err) {
      console.error('Erreur lors du chargement de la checklist:', err);
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleAssign = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await bankRefundApiService.assign(id, 'Prise en charge');
      fetchRequest();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'assignation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const dto: ApproveDto = {
        notes: approveNotes,
        checklist: checklist.filter(c => c.checked).map(c => ({ id: c.id, checked: c.checked as boolean })),
      };
      await bankRefundApiService.approve(id, dto);
      setShowApproveModal(false);
      setApproveNotes('');
      fetchRequest();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'approbation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const dto: RejectDto = {
        reason: rejectReason,
        notes: rejectNotes,
      };
      await bankRefundApiService.reject(id, dto);
      setShowRejectModal(false);
      setRejectReason('');
      setRejectNotes('');
      fetchRequest();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors du rejet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const dto: MarkPaidDto = {
        paymentReference: paidReference,
        notes: paidNotes,
      };
      await bankRefundApiService.markPaid(id, dto);
      setShowPaidModal(false);
      setPaidReference('');
      setPaidNotes('');
      fetchRequest();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center py-12 text-red-600">
        <AlertCircle className="mr-2 h-5 w-5" />
        {error || 'Demande introuvable'}
      </div>
    );
  }

  const canAssign = request.status === 'PENDING_REVIEW';
  const canApprove = request.status === 'IN_VERIFICATION';
  const canReject = request.status === 'IN_VERIFICATION';
  const canMarkPaid = request.status === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/refunds/bank-requests')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Demande de remboursement bancaire</h1>
            <p className="text-gray-600">{request.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canAssign && (
            <button
              onClick={handleAssign}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              S'assigner
            </button>
          )}
          {canApprove && (
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Approuver
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Rejeter
            </button>
          )}
          {canMarkPaid && (
            <button
              onClick={() => setShowPaidModal(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Marquer payé
            </button>
          )}
        </div>
      </div>

      {/* Statut */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <span className={`inline-block px-3 py-1 text-sm rounded ${STATUS_BADGES[request.status]?.bg} ${STATUS_BADGES[request.status]?.text}`}>
            {STATUS_BADGES[request.status]?.label || request.status}
          </span>
          {request.slaStatus && (
            <span className="text-sm text-gray-600">
              SLA: {request.slaRemainingDays !== undefined ? `${request.slaRemainingDays}j restants` : '-'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations client */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Client
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Nom:</span>
              <span className="font-medium">
                {request.user?.firstName} {request.user?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Téléphone:</span>
              <span className="font-medium">{request.user?.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{request.user?.email || '-'}</span>
            </div>
            {request.isDiaspora && (
              <div className="flex justify-between">
                <span className="text-gray-600">Diaspora:</span>
                <span className="font-medium text-blue-600">Oui</span>
              </div>
            )}
          </div>
        </div>

        {/* Informations remboursement */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Remboursement
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className="font-bold text-lg">{formatCFA(request.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut refund:</span>
              <span className="font-medium">{request.refund?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Raison:</span>
              <span className="font-medium">{request.refund?.reason}</span>
            </div>
          </div>
        </div>

        {/* Documents bancaires */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents bancaires
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">RIB:</span>
              {request.ribDocumentSignedUrl ? (
                <a
                  href={request.ribDocumentSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Voir
                </a>
              ) : (
                <span className="text-gray-400">Non soumis</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CNI Recto:</span>
              {request.idDocumentRectoSignedUrl ? (
                <a
                  href={request.idDocumentRectoSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Voir
                </a>
              ) : (
                <span className="text-gray-400">Non soumis</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CNI Verso:</span>
              {request.idDocumentVersoSignedUrl ? (
                <a
                  href={request.idDocumentVersoSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Voir
                </a>
              ) : (
                <span className="text-gray-400">Non soumis</span>
              )}
            </div>
            {request.ribHolderName && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Titulaire:</span>
                  <span className="font-medium">{request.ribHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Banque:</span>
                  <span className="font-medium">{request.ribBankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IBAN:</span>
                  <span className="font-medium">{request.ribIban}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Workflow */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Workflow
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Agent assigné:</span>
              <span className="font-medium">
                {request.assignedAgent
                  ? `${request.assignedAgent.firstName} ${request.assignedAgent.lastName}`
                  : 'Non assigné'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Début vérification:</span>
              <span className="font-medium">
                {request.reviewStartedAt
                  ? formatDate(new Date(request.reviewStartedAt))
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Documents soumis:</span>
              <span className="font-medium">
                {request.documentsSubmittedAt
                  ? formatDate(new Date(request.documentsSubmittedAt))
                  : '-'}
              </span>
            </div>
            {request.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Payé le:</span>
                <span className="font-medium text-green-600">
                  {formatDate(new Date(request.paidAt))}
                </span>
              </div>
            )}
            {request.paymentReference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Référence virement:</span>
                <span className="font-medium">{request.paymentReference}</span>
              </div>
            )}
            {request.rejectionReason && (
              <div className="border-t pt-2 mt-2">
                <div className="text-gray-600">Motif de rejet:</div>
                <div className="text-red-600 mt-1">{request.rejectionReason}</div>
              </div>
            )}
            {request.agentNotes && (
              <div className="border-t pt-2 mt-2">
                <div className="text-gray-600">Notes agent:</div>
                <div className="text-sm mt-1">{request.agentNotes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Approuver */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Approuver la demande
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Notes de vérification (obligatoire)</label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Décrivez les vérifications effectuées..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Checklist de vérification</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                  {checklist.map((item) => (
                    <label key={item.id} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistToggle(item.id)}
                        className="mt-1"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading || approveNotes.length < 10}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approuver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejeter */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejeter la demande
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Motif de rejet (obligatoire)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Expliquez le motif du rejet..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes complémentaires</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Informations supplémentaires..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || rejectReason.length < 10}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Marquer payé */}
      {showPaidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Marquer comme payé
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Référence du virement (obligatoire)</label>
                <input
                  type="text"
                  value={paidReference}
                  onChange={(e) => setPaidReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: VIREMENT-2024-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes complémentaires</label>
                <textarea
                  value={paidNotes}
                  onChange={(e) => setPaidNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Informations supplémentaires..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowPaidModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={actionLoading || !paidReference}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
