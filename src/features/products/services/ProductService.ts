import api from '../../../core/api';
import type { Product, ProductStatus, PaginatedResponse } from '../../../core/types';
import type {
  ProductWithStock,
  ProductsFilters,
  CreateProductPayload,
  UpdateProductPayload,
  ProductStats,
} from '../store/products.store';

// ─── Types retournés ─────────────────────────────────────────────────────────

export type { ProductWithStock, ProductStats };

export interface BulkImageItem {
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

// ─── Liste & Recherche ───────────────────────────────────────────────────────

export const getProducts = (
  filters: ProductsFilters,
): Promise<PaginatedResponse<ProductWithStock>> => {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.categorySlug) params.append('categorySlug', filters.categorySlug);
  if (filters.status) params.append('status', filters.status);
  if (filters.deletedOnly) params.append('deletedOnly', 'true');
  params.append('page', String(filters.page));
  params.append('pageSize', String(filters.pageSize));
  params.append('sortBy', filters.sortBy);
  params.append('sortOrder', filters.sortOrder);

  return api
    .get<PaginatedResponse<ProductWithStock>>(`/products/admin?${params.toString()}`)
    .then((res) => res.data);
};

export const getProductById = (id: string): Promise<ProductWithStock> =>
  api.get<ProductWithStock>(`/products/admin/${id}`).then((res) => res.data);

export const getProductStats = (): Promise<ProductStats> =>
  api.get<ProductStats>('/products/stats').then((res) => res.data);

// ─── CRUD ────────────────────────────────────────────────────────────────────

export const createProduct = (payload: CreateProductPayload): Promise<ProductWithStock> =>
  api.post<ProductWithStock>('/products', payload).then((res) => res.data);

export const updateProduct = (
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductWithStock> =>
  api.put<ProductWithStock>(`/products/${id}`, payload).then((res) => res.data);

export const updateProductStatus = (
  id: string,
  status: ProductStatus,
): Promise<ProductWithStock> =>
  api
    .patch<ProductWithStock>(`/products/${id}/status?status=${status}`)
    .then((res) => res.data);

export const deleteProduct = (id: string): Promise<void> =>
  api.delete(`/products/${id}`).then(() => undefined);

export const restoreProduct = (id: string): Promise<ProductWithStock> =>
  api.patch<ProductWithStock>(`/products/${id}/restore`).then((res) => res.data);

// ─── Images ──────────────────────────────────────────────────────────────────

export const addProductImage = (
  productId: string,
  url: string,
  isPrimary = false,
): Promise<Product> =>
  api
    .post<Product>(`/products/${productId}/images`, { url, isPrimary })
    .then((res) => res.data);

export const addProductImagesBulk = (
  productId: string,
  images: BulkImageItem[],
): Promise<Product> =>
  api
    .post<Product>(`/products/${productId}/images/bulk`, { images })
    .then((res) => res.data);

export const removeProductImage = (imageId: string): Promise<void> =>
  api.delete(`/products/images/${imageId}`).then(() => undefined);

// ─── Objet service (alternative à l'import nommé) ────────────────────────────

const ProductService = {
  getProducts,
  getProductById,
  getProductStats,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  restoreProduct,
  addProductImage,
  addProductImagesBulk,
  removeProductImage,
};

export default ProductService;
