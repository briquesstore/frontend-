import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Star, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductStatus } from '@/core/types';
import { useProductsStore } from './store/products.store';
import { useCategoriesStore } from './store/categories.store';
import { useAuthStore } from '@/core/stores/auth.store';

type FormTab = 'general' | 'specs' | 'pricing' | 'images' | 'status';

const TABS: { key: FormTab; label: string }[] = [
  { key: 'general', label: 'Infos générales' },
  { key: 'specs', label: 'Caractéristiques' },
  { key: 'pricing', label: 'Tarification' },
  { key: 'images', label: 'Images' },
  { key: 'status', label: 'Statut' },
];

interface FormData {
  name: string;
  reference: string;
  categoryId: string;
  description: string;
  usages: string[];
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  weightKg: string;
  unitPrice: string;
  bulkPrice: string;
  bulkMinQuantity: string;
  status: ProductStatus;
}

const EMPTY_FORM: FormData = {
  name: '',
  reference: '',
  categoryId: '',
  description: '',
  usages: [],
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  weightKg: '',
  unitPrice: '',
  bulkPrice: '',
  bulkMinQuantity: '',
  status: 'ACTIVE',
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export default function ProductFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  const isEdit = !!params.id;
  const productId = params.id;

  const { createProduct, updateProduct, fetchProductById, loading, error, clearError } = useProductsStore();
  const { categories, fetchCategories, loading: categoriesLoading } = useCategoriesStore();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [activeTab, setActiveTab] = useState<FormTab>('general');
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [usageInput, setUsageInput] = useState('');
  const [images, setImages] = useState<{ file: File; preview: string; isPrimary: boolean }[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; isPrimary: boolean; sortOrder: number }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (isEdit && productId) {
      fetchProductById(productId).then((product) => {
        if (product) {
          setForm({
            name: product.name,
            reference: product.reference,
            categoryId: product.categoryId ?? '',
            description: product.description ?? '',
            usages: product.usages ?? [],
            lengthCm: product.lengthCm != null ? String(product.lengthCm) : '',
            widthCm: product.widthCm != null ? String(product.widthCm) : '',
            heightCm: product.heightCm != null ? String(product.heightCm) : '',
            weightKg: product.weightKg != null ? String(product.weightKg) : '',
            unitPrice: String(product.unitPrice),
            bulkPrice: product.bulkPrice != null ? String(product.bulkPrice) : '',
            bulkMinQuantity: product.bulkMinQuantity != null ? String(product.bulkMinQuantity) : '',
            status: product.status,
          });
          if (product.images?.length) {
            setExistingImages(product.images);
          }
        }
      });
    }
  }, [isEdit, productId, fetchProductById]);

  const update = (field: keyof FormData, value: string | string[] | ProductStatus) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addUsage = () => {
    if (usageInput.trim() && !form.usages.includes(usageInput.trim())) {
      update('usages', [...form.usages, usageInput.trim()]);
      setUsageInput('');
    }
  };

  const removeUsage = (u: string) => {
    update('usages', form.usages.filter((x) => x !== u));
  };

  const totalImages = existingImages.length + images.length;

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - totalImages;
    if (remaining <= 0) return;
    const toAdd = Array.from(files).slice(0, remaining);
    const newImages = toAdd.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: existingImages.length === 0 && images.length === 0 && i === 0,
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const setPrimary = (index: number) => {
    setExistingImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const setExistingPrimary = (id: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: false })));
    setExistingImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some((img) => img.isPrimary) && existingImages.every((img) => !img.isPrimary)) {
        filtered[0]!.isPrimary = true;
      }
      return filtered;
    });
  };

  const removeExistingImage = async (imageId: string) => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/products/images/${imageId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        }
      );
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setSubmitError("Erreur lors de la suppression de l'image");
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    clearError();

    if (!form.name.trim()) { setSubmitError('Le nom du produit est requis'); setActiveTab('general'); return; }
    if (!form.categoryId) { setSubmitError('La catégorie est requise'); setActiveTab('general'); return; }
    if (!form.unitPrice || Number(form.unitPrice) <= 0) { setSubmitError('Le prix unitaire est requis'); setActiveTab('pricing'); return; }

    const payload = {
      name: form.name.trim(),
      reference: form.reference.trim() || undefined,
      categoryId: form.categoryId || undefined,
      description: form.description.trim() || undefined,
      usages: form.usages,
      lengthCm: form.lengthCm ? Number(form.lengthCm) : undefined,
      widthCm: form.widthCm ? Number(form.widthCm) : undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      unitPrice: Math.round(Number(form.unitPrice)),
      bulkPrice: form.bulkPrice ? Math.round(Number(form.bulkPrice)) : undefined,
      bulkMinQuantity: form.bulkMinQuantity ? Math.round(Number(form.bulkMinQuantity)) : undefined,
      status: form.status,
    };

    try {
      let savedProduct;
      if (isEdit && productId) {
        savedProduct = await updateProduct(productId, payload);
      } else {
        savedProduct = await createProduct(payload);
      }

      // Upload images (nouvelles images seulement)
      if (images.length > 0 && savedProduct?.id) {
        setUploadingImages(true);
        const formData = new FormData();
        images.forEach((img) => formData.append('images', img.file));
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/products/${savedProduct.id}/images/bulk`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}` },
              credentials: 'include',
              body: formData,
            }
          );
          if (!res.ok) {
            console.error('Erreur upload images:', await res.text());
          }
        } catch {
          // Images non critiques — le produit est sauvegardé
        } finally {
          setUploadingImages(false);
        }
      }

      navigate('/admin/products');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setSubmitError(message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/products')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEdit ? `Modification de ${form.name || 'produit'}` : 'Ajoutez un nouveau produit au catalogue'}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF8C00] text-white text-sm font-medium rounded-lg hover:bg-[#E67E00] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEdit ? 'Enregistrer' : 'Créer le produit'}
        </button>
      </div>

      {/* Error banner */}
      {(submitError || error) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{submitError || error}</span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Tab Nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-[#FF8C00] text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {/* General */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Nom du produit" required />
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="Ex: Brique Pleine 20cm"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Référence" />
                    <input
                      type="text"
                      value={form.reference}
                      onChange={(e) => update('reference', e.target.value)}
                      placeholder="Auto-générée si vide"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel label="Catégorie" required />
                  <select
                    value={form.categoryId}
                    onChange={(e) => update('categoryId', e.target.value)}
                    disabled={categoriesLoading}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none disabled:bg-gray-50"
                  >
                    <option value="">{categoriesLoading ? 'Chargement...' : 'Sélectionner une catégorie'}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="Description technique" />
                  <textarea
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={4}
                    placeholder="Description détaillée du produit..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none resize-none"
                  />
                </div>
                <div>
                  <FieldLabel label="Usages recommandés" />
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={usageInput}
                      onChange={(e) => setUsageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUsage())}
                      placeholder="Ex: Murs porteurs"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
                    />
                    <button onClick={addUsage} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">
                      Ajouter
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.usages.map((u) => (
                      <span key={u} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-[#FF8C00] text-xs font-medium rounded-full">
                        {u}
                        <button onClick={() => removeUsage(u)} className="hover:text-red-500"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Specs */}
            {activeTab === 'specs' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques physiques</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <FieldLabel label="Longueur (cm)" />
                    <input type="number" value={form.lengthCm} onChange={(e) => update('lengthCm', e.target.value)} placeholder="40" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none" />
                  </div>
                  <div>
                    <FieldLabel label="Largeur (cm)" />
                    <input type="number" value={form.widthCm} onChange={(e) => update('widthCm', e.target.value)} placeholder="20" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none" />
                  </div>
                  <div>
                    <FieldLabel label="Hauteur (cm)" />
                    <input type="number" value={form.heightCm} onChange={(e) => update('heightCm', e.target.value)} placeholder="20" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none" />
                  </div>
                  <div>
                    <FieldLabel label="Poids (kg)" />
                    <input type="number" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} placeholder="12" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">
                    Les dimensions sont utilisées pour le calcul des volumes de livraison et l'affichage sur la fiche produit client.
                  </p>
                </div>
              </div>
            )}

            {/* Pricing */}
            {activeTab === 'pricing' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarification (en FCFA)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Prix unitaire (FCFA)" required />
                    <input type="number" value={form.unitPrice} onChange={(e) => update('unitPrice', e.target.value)} placeholder="350" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none" />
                  </div>
                  <div>
                    <FieldLabel label="Prix gros (FCFA)" />
                    <input type="number" value={form.bulkPrice} onChange={(e) => update('bulkPrice', e.target.value)} placeholder="300" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none" />
                  </div>
                  <div>
                    <FieldLabel label="Quantité min. pour prix gros" />
                    <input type="number" value={form.bulkMinQuantity} onChange={(e) => update('bulkMinQuantity', e.target.value)} placeholder="500" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm text-[#FF8C00] font-medium">
                    Le prix gros s'applique automatiquement lorsque la quantité commandée atteint le seuil minimum.
                  </p>
                </div>
              </div>
            )}

            {/* Images */}
            {activeTab === 'images' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Images du produit</h2>
                <p className="text-sm text-gray-500 mb-4">1 à 5 images — JPG, PNG ou WebP — Max 5 Mo chacune</p>

                {/* Drop zone */}
                <label className={cn(
                  'w-full border-2 border-dashed border-gray-300 rounded-xl py-10 flex flex-col items-center gap-2 cursor-pointer hover:border-[#FF8C00] hover:bg-orange-50/30 transition-colors',
                  images.length >= 5 && 'opacity-40 pointer-events-none',
                )}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageFiles(e.target.files)}
                  />
                  <Upload size={24} className="text-gray-400" />
                  <p className="text-sm text-gray-500">Cliquez ou glissez-déposez vos images</p>
                  <p className="text-xs text-gray-400">{totalImages}/5 images</p>
                </label>

                {/* Existing images (from server) */}
                {existingImages.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Images existantes</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {existingImages.map((img) => (
                        <div key={img.id} className={cn(
                          'relative rounded-xl border-2 p-2 transition-colors',
                          img.isPrimary ? 'border-[#FF8C00] bg-orange-50/30' : 'border-gray-200',
                        )}>
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                            <img src={img.url} alt="Produit" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <button
                              onClick={() => setExistingPrimary(img.id)}
                              className={cn('text-xs font-medium', img.isPrimary ? 'text-[#FF8C00]' : 'text-gray-400 hover:text-[#FF8C00]')}
                            >
                              <Star size={12} className="inline mr-0.5" fill={img.isPrimary ? '#FF8C00' : 'none'} />
                              {img.isPrimary ? 'Principale' : 'Définir'}
                            </button>
                            <button onClick={() => removeExistingImage(img.id)} className="text-xs text-red-400 hover:text-red-600">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New images (to upload) */}
                {images.length > 0 && (
                  <div>
                    {existingImages.length > 0 && (
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Nouvelles images</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {images.map((img, index) => (
                        <div key={index} className={cn(
                          'relative rounded-xl border-2 p-2 transition-colors',
                          img.isPrimary ? 'border-[#FF8C00] bg-orange-50/30' : 'border-gray-200',
                        )}>
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                            <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs text-gray-600 truncate">{img.file.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <button
                              onClick={() => setPrimary(index)}
                              className={cn('text-xs font-medium', img.isPrimary ? 'text-[#FF8C00]' : 'text-gray-400 hover:text-[#FF8C00]')}
                            >
                              <Star size={12} className="inline mr-0.5" fill={img.isPrimary ? '#FF8C00' : 'none'} />
                              {img.isPrimary ? 'Principale' : 'Définir'}
                            </button>
                            <button onClick={() => removeImage(index)} className="text-xs text-red-400 hover:text-red-600">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadingImages && (
                  <div className="flex items-center gap-2 text-sm text-[#FF8C00]">
                    <Loader2 size={16} className="animate-spin" />
                    Upload des images en cours...
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            {activeTab === 'status' && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Statut du produit</h2>
                <div className="space-y-3">
                  {([
                    { value: 'ACTIVE' as ProductStatus, label: 'Actif', desc: 'Visible dans le catalogue client et disponible à la vente', color: 'border-green-500 bg-green-50' },
                    { value: 'HIDDEN' as ProductStatus, label: 'Masqué', desc: 'Non visible pour les clients — utilisable comme produit offert (promotion)', color: 'border-yellow-500 bg-yellow-50' },
                    { value: 'ARCHIVED' as ProductStatus, label: 'Archivé', desc: 'Retiré du catalogue, conservé pour l\'historique', color: 'border-gray-400 bg-gray-50' },
                  ]).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => update('status', option.value)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border-2 transition-colors',
                        form.status === option.value ? option.color : 'border-gray-200 hover:border-gray-300',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2',
                          form.status === option.value ? 'border-[#FF8C00] bg-[#FF8C00]' : 'border-gray-300',
                        )}>
                          {form.status === option.value && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
