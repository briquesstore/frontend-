import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  reference: string;
  status?: 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
}

interface PromotionFormData {
  title: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY' | 'FREE_PRODUCT';
  value: number;
  code: string;
  minAmount?: number;
  maxDiscount?: number;
  freeProductId?: string;
  freeProductQty?: number;
  minQuantity?: number;
  freeProductName?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function PromotionFormModal({ isOpen, onClose, onSuccess, editData }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [form, setForm] = useState<PromotionFormData>({
    title: editData?.title || '',
    description: editData?.description || '',
    type: editData?.type || 'PERCENTAGE',
    value: editData?.value || 10,
    code: editData?.code || '',
    minAmount: editData?.minAmount || undefined,
    maxDiscount: editData?.maxDiscount || undefined,
    freeProductId: editData?.freeProductId || undefined,
    freeProductQty: editData?.freeProductQty || 1,
    minQuantity: editData?.minQuantity || undefined,
    freeProductName: editData?.freeProductName || undefined,
    startDate: editData?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: editData?.endDate?.split('T')[0] || '',
    isActive: editData?.isActive ?? true,
    usageLimit: editData?.usageLimit || undefined,
  });

  // Load products for FREE_PRODUCT type
  useEffect(() => {
    if (form.type === 'FREE_PRODUCT' && products.length === 0) {
      setLoadingProducts(true);
      apiClient.get<{ data: Product[] }>('/products/admin?pageSize=100')
        .then(({ data }) => setProducts(data.data || []))
        .catch(console.error)
        .finally(() => setLoadingProducts(false));
    }
  }, [form.type, products.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation for FREE_PRODUCT
    if (form.type === 'FREE_PRODUCT') {
      if (!form.freeProductId && !form.freeProductName?.trim()) {
        setError('Veuillez sélectionner un produit existant ou saisir le nom du produit offert');
        return;
      }
      if (!form.minQuantity || form.minQuantity < 1) {
        setError('Veuillez définir la quantité minimum pour déclencher l\'offre');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        value: form.type === 'FREE_PRODUCT' ? 0 : Number(form.value),
        minAmount: form.minAmount ? Number(form.minAmount) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        freeProductId: form.type === 'FREE_PRODUCT' ? (form.freeProductId || undefined) : undefined,
        freeProductQty: form.type === 'FREE_PRODUCT' ? Number(form.freeProductQty) : undefined,
        minQuantity: form.type === 'FREE_PRODUCT' ? Number(form.minQuantity) : undefined,
        freeProductName: form.type === 'FREE_PRODUCT' ? (form.freeProductName?.trim() || undefined) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      };

      if (editData?.id) {
        await apiClient.patch(`/promotions/${editData.id}`, payload);
      } else {
        await apiClient.post('/promotions', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PROMO';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, code });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {editData ? 'Modifier la promotion' : 'Nouvelle promotion'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
              placeholder="Ex: Soldes d'été -20%"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
              rows={2}
              placeholder="Description de la promotion..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
              >
                <option value="PERCENTAGE">Pourcentage (%)</option>
                <option value="FIXED_AMOUNT">Montant fixe (FCFA)</option>
                <option value="FREE_DELIVERY">Livraison gratuite</option>
                <option value="FREE_PRODUCT">🎁 Produit offert</option>
              </select>
            </div>

            {(form.type === 'PERCENTAGE' || form.type === 'FIXED_AMOUNT') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur * {form.type === 'PERCENTAGE' ? '(%)' : '(FCFA)'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={form.type === 'PERCENTAGE' ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                />
              </div>
            )}
          </div>

          {/* FREE_PRODUCT specific fields */}
          {form.type === 'FREE_PRODUCT' && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
              <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                🎁 Configuration du produit offert
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit à offrir *</label>
                {loadingProducts ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Chargement des produits...
                  </div>
                ) : (
                  <select
                    value={form.freeProductId || ''}
                    onChange={(e) => setForm({ ...form, freeProductId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                  >
                    <option value="">-- Sélectionner un produit --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.reference}){p.status && p.status !== 'ACTIVE' ? ' — hors vente' : ''}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">Laissez vide et renseignez le nom ci-dessous si le produit n&apos;existe pas dans le catalogue.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit offert (saisie libre)</label>
                <input
                  type="text"
                  value={form.freeProductName || ''}
                  onChange={(e) => setForm({ ...form, freeProductName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                  placeholder="Ex: Sac de ciment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité offerte *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.freeProductQty || 1}
                    onChange={(e) => setForm({ ...form, freeProductQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qté min. pour déclencher *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.minQuantity || ''}
                    onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                    placeholder="Ex: 250"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ex: 250 briques commandées = 1 sac ciment offert</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code promo *</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none font-mono"
                placeholder="CODE2024"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
              >
                Générer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin *</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant min. (FCFA)</label>
              <input
                type="number"
                min={0}
                value={form.minAmount || ''}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                placeholder="Optionnel"
              />
            </div>
            {form.type === 'PERCENTAGE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Réduction max. (FCFA)</label>
                <input
                  type="number"
                  min={0}
                  value={form.maxDiscount || ''}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                  placeholder="Optionnel"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite d'utilisation</label>
              <input
                type="number"
                min={1}
                value={form.usageLimit || ''}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                placeholder="Illimité"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#FF8C00] focus:ring-[#FF8C00]"
                />
                <span className="text-sm font-medium text-gray-700">Activer immédiatement</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF8C00] text-white font-semibold rounded-lg hover:bg-[#E67E00] disabled:opacity-50"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {editData ? 'Enregistrer' : 'Créer la promotion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
