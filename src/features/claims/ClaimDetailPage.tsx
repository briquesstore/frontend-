import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Plus, Image, Loader2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/core/stores/auth.store';
import { hasPermission } from '@/core/permissions';
import { formatDateTime } from '@/core/utils/formatters';
import { CLAIM_TYPE_LABELS, CLAIM_STATUS_LABELS } from '@/core/types';
import type { ClaimStatus, ClaimType } from '@/core/types';
import { claimsApiService, type ClaimDetail, type ResolveAction } from './services/claims-api.service';
import ContactActions from '@/components/ContactActions';

const STATUS_COLORS: Record<ClaimStatus, { bg: string; text: string }> = {
  OPEN: { bg: 'bg-red-50', text: 'text-red-700' },
  IN_PROGRESS: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  RESOLVED: { bg: 'bg-green-50', text: 'text-green-700' },
  CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const RESOLUTION_OPTIONS: Record<ClaimType, { value: ResolveAction; label: string }[]> = {
  DEFECTIVE_PRODUCT: [
    { value: 'REFUND', label: 'Remboursement' },
    { value: 'EXCHANGE', label: 'Échange' },
    { value: 'GESTURE', label: 'Geste commercial' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
  WRONG_PRODUCT: [
    { value: 'REFUND', label: 'Remboursement' },
    { value: 'EXCHANGE', label: 'Échange' },
    { value: 'GESTURE', label: 'Geste commercial' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
  DAMAGED_IN_TRANSIT: [
    { value: 'REFUND', label: 'Remboursement' },
    { value: 'EXCHANGE', label: 'Échange' },
    { value: 'GESTURE', label: 'Geste commercial' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
  MISSING_ITEMS: [
    { value: 'REFUND', label: 'Remboursement' },
    { value: 'EXCHANGE', label: 'Renvoi' },
    { value: 'GESTURE', label: 'Geste commercial' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
  DELIVERY_ISSUE: [
    { value: 'REFUND', label: 'Remboursement' },
    { value: 'GESTURE', label: 'Geste commercial' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
  PREORDER_REFUND: [
    { value: 'CANCEL', label: 'Annuler et rembourser' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
  CANCELLATION_REQUEST: [
    { value: 'CANCEL', label: 'Annuler et rembourser' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
  OTHER: [
    { value: 'REFUND', label: 'Remboursement' },
    { value: 'GESTURE', label: 'Geste commercial' },
    { value: 'REJECT', label: 'Refuser' },
    { value: 'CLOSE', label: 'Clôturer' },
  ],
};

export default function ClaimDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const claimId = params.id;
  const user = useAuthStore((s) => s.user);
  const canResolve = user ? hasPermission(user.role, 'claims.resolve') : false;

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionAction, setResolutionAction] = useState<ResolveAction>('REFUND');
  const [resolutionNote, setResolutionNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [resolving, setResolving] = useState(false);

  const resolveOptions = claim ? RESOLUTION_OPTIONS[claim.type] : [];

  const openResolve = () => {
    if (!claim) return;
    setResolutionAction(resolveOptions[0]?.value ?? 'REFUND');
    setResolutionNote('');
    setRefundAmount('');
    setShowResolve(true);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) return;
    setResolving(true);
    try {
      const amount = resolutionAction === 'REFUND' && refundAmount.trim()
        ? parseInt(refundAmount, 10)
        : undefined;
      const updated = await claimsApiService.resolveClaim(claim.id, {
        action: resolutionAction,
        note: resolutionNote,
        amount,
      });
      setClaim(updated);
      setShowResolve(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la résolution');
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    setError(null);
    claimsApiService
      .getClaim(claimId)
      .then((data) => setClaim(data))
      .catch((err) => setError(err.message || 'Erreur lors du chargement de la réclamation'))
      .finally(() => setLoading(false));
  }, [claimId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-500">
        <Loader2 size={32} className="animate-spin mb-3" />
        <p className="text-sm">Chargement de la réclamation…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/admin/claims')} className="p-2 rounded-lg hover:bg-gray-100 mb-4">
          <ArrowLeft size={20} />
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/admin/claims')} className="p-2 rounded-lg hover:bg-gray-100 mb-4">
          <ArrowLeft size={20} />
        </button>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
          Réclamation introuvable
        </div>
      </div>
    );
  }

  const sc = STATUS_COLORS[claim.status];
  const orderLink = claim.orderId
    ? `/admin/orders/${claim.orderId}`
    : claim.preorderId
    ? `/admin/preorders/${claim.preorderId}`
    : undefined;
  const orderText = claim.orderNumber || claim.preorderNumber || '-';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/claims')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{claim.number}</h1>
            <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', sc.bg, sc.text)}>
              {CLAIM_STATUS_LABELS[claim.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Ouverte le {formatDateTime(claim.createdAt)}</p>
        </div>
        {canResolve && claim.status !== 'CLOSED' && claim.status !== 'RESOLVED' && (
          <button
            onClick={openResolve}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#FF8C00] rounded-lg hover:bg-[#E67E00]"
          >
            <CheckCircle size={16} /> Résoudre
          </button>
        )}
      </div>

      {/* Resolution Modal */}
      {showResolve && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Résoudre la réclamation</h3>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Action</label>
                <div className="grid grid-cols-2 gap-2">
                  {resolveOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setResolutionAction(opt.value)}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-center',
                        resolutionAction === opt.value
                          ? 'border-[#FF8C00] bg-orange-50 text-[#FF8C00]'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {resolutionAction === 'REFUND' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant à rembourser (FCFA)</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Empêcher de dépasser le max remboursable
                      if (val && parseInt(val, 10) > claim.maxRefundable) {
                        setRefundAmount(claim.maxRefundable.toString());
                      } else {
                        setRefundAmount(val);
                      }
                    }}
                    placeholder={`Max: ${claim.maxRefundable.toLocaleString('fr-FR')} FCFA`}
                    min={1}
                    max={claim.maxRefundable}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
                  />
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs space-y-1">
                    <p className="flex justify-between">
                      <span className="text-gray-500">Total payé :</span>
                      <span className="font-semibold text-gray-700">{claim.totalPaid.toLocaleString('fr-FR')} FCFA</span>
                    </p>
                    {claim.totalRefunded > 0 && (
                      <p className="flex justify-between">
                        <span className="text-gray-500">Déjà remboursé/en cours :</span>
                        <span className="font-semibold text-orange-600">-{claim.totalRefunded.toLocaleString('fr-FR')} FCFA</span>
                      </p>
                    )}
                    <p className="flex justify-between border-t border-gray-200 pt-1">
                      <span className="text-gray-700 font-medium">Maximum remboursable :</span>
                      <span className="font-bold text-green-600">{claim.maxRefundable.toLocaleString('fr-FR')} FCFA</span>
                    </p>
                  </div>
                  {claim.maxRefundable === 0 && (
                    <p className="text-xs text-red-500 mt-1 font-medium">⚠️ Aucun montant remboursable disponible.</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Note de résolution</label>
                <textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  placeholder="Détaillez la résolution..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button type="button" onClick={() => setShowResolve(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    resolving ||
                    ((resolutionAction === 'REJECT' || resolutionAction === 'CLOSE' || resolutionAction === 'GESTURE' || resolutionAction === 'EXCHANGE') &&
                      !resolutionNote.trim()) ||
                    (resolutionAction === 'REFUND' && claim.maxRefundable === 0)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-[#FF8C00] rounded-lg hover:bg-[#E67E00] disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {resolving && <Loader2 size={16} className="animate-spin" />}
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Description du problème</h3>
            <p className="text-xs text-gray-400 mb-3">{CLAIM_TYPE_LABELS[claim.type]}</p>
            <p className="text-sm text-gray-700 leading-relaxed">{claim.description}</p>

            {claim.photoUrls.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Photos jointes ({claim.photoUrls.length})</p>
                <div className="flex gap-3">
                  {claim.photoUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden"
                    >
                      <Image size={20} className="text-gray-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Historique</h3>
            <div className="space-y-4">
              {claim.timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#FF8C00] mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.action}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(event.date)} — {event.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal comments */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Commentaires internes</h3>
            <div className="space-y-3 mb-4">
              {claim.internalComments.map((c) => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">{c.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{c.author} — {formatDateTime(c.date)}</p>
                </div>
              ))}
              {claim.internalComments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun commentaire</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire interne..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
              />
              <button
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-[#FF8C00] text-white text-sm font-medium rounded-lg hover:bg-[#E67E00] disabled:opacity-50"
              >
                <Plus size={16} className="inline mr-1" /> Ajouter
              </button>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Order link */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Commande liée</h3>
            {orderLink ? (
              <button
                onClick={() => navigate(orderLink)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-[#FF8C00] hover:bg-orange-50/30 transition-colors"
              >
                <p className="text-sm font-semibold text-[#FF8C00]">{orderText}</p>
                <p className="text-xs text-gray-500 mt-0.5">Cliquez pour voir le détail</p>
              </button>
            ) : (
              <div className="w-full p-3 rounded-lg border border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-gray-500">{orderText}</p>
              </div>
            )}
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Client</h3>
            <div className="space-y-2 text-sm mb-4">
              <p className="font-medium text-gray-900">{claim.customerName}</p>
              <p className="text-gray-500">{claim.customerPhone || '—'}</p>
              <p className="text-gray-500">{claim.customerEmail || '—'}</p>
            </div>
            <ContactActions
              phone={claim.customerPhone}
              email={claim.customerEmail}
              size={14}
              defaultMessage={`Bonjour ${claim.customerName}, je vous contacte suite à votre réclamation ${claim.number} sur BRIQUES.STORE.`}
              emailSubject={`BRIQUES.STORE - Réclamation ${claim.number}`}
            />
          </div>

          {/* Resolution */}
          {claim.resolution && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Résolution</h3>
              <p className="text-sm text-gray-700">{claim.resolution}</p>
              {claim.resolvedAt && (
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(claim.resolvedAt)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
