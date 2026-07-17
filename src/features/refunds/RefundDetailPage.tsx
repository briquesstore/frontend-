import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, XCircle, CreditCard, User, FileText, RotateCcw, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCFA, formatDateTime } from '@/core/utils/formatters';
import { REFUND_STATUS_LABELS, REFUND_STATUS_COLORS, REFUND_REASON_LABELS } from '@/core/types';
import { useAuthStore } from '@/core/stores/auth.store';
import { hasPermission } from '@/core/permissions';
import { refundsApiService, type RefundDetail } from './refunds-api.service';

export default function RefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canManage = user ? hasPermission(user.role, 'refunds.manage') : false;

  const [refund, setRefund] = useState<RefundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'resolve' | 'cancel' | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRefund = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await refundsApiService.getRefund(id);
      setRefund(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du remboursement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefund();
  }, [id]);

  const handleMarkResolved = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !transferReference.trim()) return;
    setSubmitting(true);
    try {
      const updated = await refundsApiService.markResolved(id, transferReference.trim());
      setRefund(updated);
      setAction(null);
      setTransferReference('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !cancelReason.trim()) return;
    setSubmitting(true);
    try {
      const updated = await refundsApiService.cancelRefund(id, cancelReason.trim());
      setRefund(updated);
      setAction(null);
      setCancelReason('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Chargement du remboursement…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/admin/refunds')} className="p-2 rounded-lg hover:bg-gray-100 mb-4">
          <ArrowLeft size={20} />
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/admin/refunds')} className="p-2 rounded-lg hover:bg-gray-100 mb-4">
          <ArrowLeft size={20} />
        </button>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
          Remboursement non trouvé.
        </div>
      </div>
    );
  }

  const statusColor = REFUND_STATUS_COLORS[refund.status];
  const isTreatable = refund.status === 'MANUAL' || refund.status === 'PENDING' || refund.status === 'APPROVED';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/refunds')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{refund.number}</h1>
            <p className="text-sm text-gray-500">
              Créé le {formatDateTime(refund.createdAt)}
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {refund.status === 'SUCCEEDED' && <CheckCircle size={16} />}
          {refund.status === 'FAILED' && <XCircle size={16} />}
          {refund.status === 'CANCELLED' && <XCircle size={16} />}
          {refund.status === 'MANUAL' && <RotateCcw size={16} />}
          {refund.status === 'PENDING' && <Loader2 size={16} className="animate-spin" />}
          {refund.status === 'PROCESSING' && <Loader2 size={16} className="animate-spin" />}
          {refund.status === 'APPROVED' && <CheckCircle size={16} />}
          {REFUND_STATUS_LABELS[refund.status]}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Montants */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Montants</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Montant à rembourser</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCFA(refund.amount)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Paiement original</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCFA(refund.payment.amount)}</p>
                {refund.payment.method && <p className="text-xs text-gray-400 mt-1">{refund.payment.method}</p>}
              </div>
            </div>
            {refund.amount > refund.payment.amount && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} className="inline mr-2" />
                ⚠️ Le montant du remboursement dépasse le paiement original. Contrôle requis.
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Raison</p>
                  <p className="font-medium text-gray-900">{REFUND_REASON_LABELS[refund.reason]}</p>
                  {refund.reasonDetails && <p className="text-gray-600 mt-1">{refund.reasonDetails}</p>}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard size={18} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500">Paiement associé</p>
                  <p className="font-medium text-gray-900">{formatCFA(refund.payment.amount)}</p>
                </div>
              </div>
              {refund.order && (
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Commande</p>
                    <button
                      onClick={() => navigate(`/admin/orders/${refund.order?.id}`)}
                      className="font-medium text-[#FF8C00] hover:underline"
                    >
                      {refund.order.orderNumber || refund.order.id}
                    </button>
                  </div>
                </div>
              )}
              {refund.preorder && (
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Pré-commande</p>
                    <button
                      onClick={() => navigate(`/admin/preorders/${refund.preorder?.id}`)}
                      className="font-medium text-[#FF8C00] hover:underline"
                    >
                      PRÉ-{refund.preorder.id.substring(0, 8).toUpperCase()}
                    </button>
                  </div>
                </div>
              )}
              {refund.processedAt && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Traité le</p>
                    <p className="font-medium text-gray-900">{formatDateTime(refund.processedAt)}</p>
                  </div>
                </div>
              )}
              {refund.providerRefundId && (
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Référence virement</p>
                    <p className="font-medium text-gray-900">{refund.providerRefundId}</p>
                  </div>
                </div>
              )}
              {refund.failureReason && (
                <div className="flex items-start gap-3 col-span-2">
                  <XCircle size={18} className="text-red-400 mt-0.5" />
                  <div>
                    <p className="text-gray-500">Motif d&apos;échec / annulation</p>
                    <p className="font-medium text-red-600">{refund.failureReason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Client</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF8C00]/10 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-[#FF8C00]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {refund.customer.firstName} {refund.customer.lastName}
                </p>
                {refund.customer.phone && <p className="text-sm text-gray-600">{refund.customer.phone}</p>}
                {refund.customer.email && <p className="text-sm text-gray-600">{refund.customer.email}</p>}
              </div>
            </div>
            <button
              onClick={() => navigate(`/admin/customers/${refund.customer.id}`)}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-[#FF8C00] bg-orange-50 rounded-lg hover:bg-orange-100"
            >
              Voir la fiche client
            </button>
          </div>

          {/* Actions */}
          {canManage && isTreatable && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setAction('resolve')}
                  className={cn(
                    'w-full px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2',
                    action === 'resolve'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100',
                  )}
                >
                  <CheckCircle size={16} /> Marquer comme effectué
                </button>
                <button
                  onClick={() => setAction('cancel')}
                  className={cn(
                    'w-full px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2',
                    action === 'cancel'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100',
                  )}
                >
                  <XCircle size={16} /> Annuler le remboursement
                </button>
              </div>

              {action === 'resolve' && (
                <form onSubmit={handleMarkResolved} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Référence du virement <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={transferReference}
                      onChange={(e) => setTransferReference(e.target.value)}
                      placeholder="Ex: VIREMENT-123456"
                      required
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Entrez la référence du virement bancaire que vous avez effectué.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAction(null)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !transferReference.trim()}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmer'}
                    </button>
                  </div>
                </form>
              )}

              {action === 'cancel' && (
                <form onSubmit={handleCancel} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Motif d&apos;annulation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Pourquoi annulez-vous ce remboursement ?"
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAction(null)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !cancelReason.trim()}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Confirmer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {!isTreatable && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
              Ce remboursement est en statut <strong>{REFUND_STATUS_LABELS[refund.status]}</strong>. Aucune action possible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
