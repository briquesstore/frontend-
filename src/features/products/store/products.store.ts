import { create } from 'zustand';
import type { ProductStatus, PaginatedResponse, Category } from '../../../core/types';
import ProductService from '../services/ProductService';

export interface ProductWithStock {
  id: string;
  reference: string;
  name: string;
  categoryId?: string;
  category?: Category;
  description?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightKg?: number;
  unitPrice: number;
  bulkPrice?: number;
  bulkMinQuantity?: number;
  minOrderQuantity?: number;
  quantityStep?: number;
  unitLabel?: string;
  status: ProductStatus;
  usages: string[];
  images: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
  stock?: {
    available: number;
    level: 'NORMAL' | 'ALERT' | 'CRITICAL';
  };
}

export interface ProductsFilters {
  search: string;
  categorySlug: string;
  status: ProductStatus | '';
  deletedOnly: boolean;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ProductStats {
  total: number;
  active: number;
  hidden: number;
  archived: number;
  deleted: number;
  lowStock: number;
}

export interface CreateProductPayload {
  reference?: string;
  name: string;
  categoryId?: string;
  description?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightKg?: number;
  unitPrice: number;
  bulkPrice?: number;
  bulkMinQuantity?: number;
  minOrderQuantity?: number;
  quantityStep?: number;
  unitLabel?: string;
  status?: ProductStatus;
  usages?: string[];
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

interface ProductsState {
  products: ProductWithStock[];
  selectedProduct: ProductWithStock | null;
  total: number;
  totalPages: number;
  filters: ProductsFilters;
  stats: ProductStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  setFilters: (filters: Partial<ProductsFilters>) => void;
  resetFilters: () => void;
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<ProductWithStock | null>;
  fetchStats: () => Promise<void>;
  createProduct: (payload: CreateProductPayload) => Promise<ProductWithStock>;
  updateProduct: (id: string, payload: UpdateProductPayload) => Promise<ProductWithStock>;
  updateProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  restoreProduct: (id: string) => Promise<void>;
  addProductImage: (productId: string, url: string, isPrimary?: boolean) => Promise<void>;
  removeProductImage: (imageId: string) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_FILTERS: ProductsFilters = {
  search: '',
  categorySlug: '',
  status: '',
  deletedOnly: false,
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  selectedProduct: null,
  total: 0,
  totalPages: 0,
  filters: { ...DEFAULT_FILTERS },
  stats: null,
  loading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: newFilters.page ?? 1 },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const { filters } = get();
      const data: PaginatedResponse<ProductWithStock> = await ProductService.getProducts(filters);
      set({
        products: data.data,
        total: data.total,
        totalPages: data.totalPages,
        loading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des produits';
      set({ error: message, loading: false });
    }
  },

  fetchProductById: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await ProductService.getProductById(id);
      set({ selectedProduct: data, loading: false });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Produit non trouvé';
      set({ error: message, loading: false, selectedProduct: null });
      return null;
    }
  },

  fetchStats: async () => {
    try {
      const data = await ProductService.getProductStats();
      set({ stats: data });
    } catch (err: unknown) {
      console.error('Erreur chargement stats produits:', err);
    }
  },

  createProduct: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = await ProductService.createProduct(payload);
      set((state) => ({
        products: [data, ...state.products],
        loading: false,
      }));
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateProduct: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const data = await ProductService.updateProduct(id, payload);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? data : p)),
        selectedProduct: state.selectedProduct?.id === id ? data : state.selectedProduct,
        loading: false,
      }));
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateProductStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const data = await ProductService.updateProductStatus(id, status);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? data : p)),
        selectedProduct: state.selectedProduct?.id === id ? data : state.selectedProduct,
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du changement de statut';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await ProductService.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct,
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  restoreProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await ProductService.restoreProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la restauration';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  addProductImage: async (productId, url, isPrimary = false) => {
    try {
      await ProductService.addProductImage(productId, url, isPrimary);
      await get().fetchProductById(productId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'ajout de l'image";
      set({ error: message });
      throw new Error(message);
    }
  },

  removeProductImage: async (imageId) => {
    try {
      await ProductService.removeProductImage(imageId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la suppression de l'image";
      set({ error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
