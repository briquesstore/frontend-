import { apiClient } from '@/lib/api-client';
import type { ClaimType, ClaimStatus } from '@/core/types';

export interface ClaimUser {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export interface ClaimOrder {
  id: string;
  orderNumber: string;
  status: string;
}

export interface ClaimPreorder {
  id: string;
  status: string;
}

export interface ClaimComment {
  id: string;
  claimId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ClaimListItem {
  id: string;
  number: string;
  orderId?: string;
  orderNumber?: string;
  preorderId?: string;
  preorderNumber?: string;
  customerName: string;
  userId: string;
  type: ClaimType;
  status: ClaimStatus;
  assignedTo?: string;
  assignedToName?: string;
  daysSinceOpen: number;
  createdAt: string;
}

export interface ClaimDetail {
  id: string;
  number: string;
  orderId?: string;
  orderNumber?: string;
  preorderId?: string;
  preorderNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  type: ClaimType;
  status: ClaimStatus;
  description: string;
  assignedTo?: string;
  assignedToName?: string;
  photoUrls: string[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  timeline: { id: string; action: string; author: string; date: string }[];
  internalComments: { id: string; content: string; author: string; date: string }[];
  // Informations financières pour le remboursement
  totalPaid: number;
  totalRefunded: number;
  maxRefundable: number;
}

interface BackendClaimListItem {
  id: string;
  userId: string;
  type: ClaimType;
  description: string;
  status: ClaimStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: ClaimUser;
  order?: ClaimOrder | null;
  preorder?: ClaimPreorder | null;
  _count?: { comments: number };
}

interface BackendClaimDetail {
  id: string;
  userId: string;
  type: ClaimType;
  description: string;
  status: ClaimStatus;
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  photoUrls: string[];
  user?: ClaimUser;
  order?: ClaimOrder | null;
  preorder?: ClaimPreorder | null;
  comments?: ClaimComment[];
  // Informations financières
  totalPaid?: number;
  totalRefunded?: number;
  maxRefundable?: number;
}

export interface ClaimsQuery {
  status?: ClaimStatus;
  type?: ClaimType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ClaimsResponse {
  data: ClaimListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ResolveAction =
  | 'REFUND'
  | 'CANCEL'
  | 'EXCHANGE'
  | 'GESTURE'
  | 'REJECT'
  | 'CLOSE';

export interface ResolveClaimBody {
  action: ResolveAction;
  note?: string;
  amount?: number;
}

function buildNumber(id: string): string {
  return `REC-${id.substring(0, 8).toUpperCase()}`;
}

function buildCustomerName(user?: ClaimUser): string {
  if (!user) return 'Inconnu';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Inconnu';
}

function daysSinceOpen(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const diff = now.getTime() - created.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function mapListItem(item: BackendClaimListItem): ClaimListItem {
  const user = item.user;
  const customerName = buildCustomerName(user);
  const order = item.order || undefined;
  const preorder = item.preorder || undefined;

  return {
    id: item.id,
    number: buildNumber(item.id),
    userId: item.userId,
    customerName,
    orderId: order?.id,
    orderNumber: order?.orderNumber,
    preorderId: preorder?.id,
    preorderNumber: preorder ? `PRÉ-${preorder.id.substring(0, 8).toUpperCase()}` : undefined,
    type: item.type,
    status: item.status,
    assignedTo: item.assignedTo,
    assignedToName: item.assignedTo ? 'Assigné' : undefined,
    daysSinceOpen: daysSinceOpen(item.createdAt),
    createdAt: item.createdAt,
  };
}

function mapDetail(item: BackendClaimDetail): ClaimDetail {
  const user = item.user;
  const customerName = buildCustomerName(user);
  const order = item.order || undefined;
  const preorder = item.preorder || undefined;

  const timeline = [
    {
      id: 'created',
      action: 'Réclamation créée par le client',
      author: customerName,
      date: item.createdAt,
    },
  ];

  const internalComments =
    item.comments?.map((comment, index) => ({
      id: comment.id || `c-${index}`,
      content: comment.content,
      author: 'Utilisateur',
      date: comment.createdAt,
    })) || [];

  return {
    id: item.id,
    number: buildNumber(item.id),
    customerId: item.userId,
    customerName,
    customerPhone: user?.phone,
    customerEmail: user?.email,
    orderId: order?.id,
    orderNumber: order?.orderNumber,
    preorderId: preorder?.id,
    preorderNumber: preorder ? `PRÉ-${preorder.id.substring(0, 8).toUpperCase()}` : undefined,
    type: item.type,
    status: item.status,
    description: item.description,
    assignedTo: item.assignedTo,
    assignedToName: item.assignedTo ? 'Assigné' : undefined,
    photoUrls: item.photoUrls || [],
    resolution: item.resolution,
    resolvedAt: item.resolvedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    timeline,
    internalComments,
    // Informations financières
    totalPaid: item.totalPaid ?? 0,
    totalRefunded: item.totalRefunded ?? 0,
    maxRefundable: item.maxRefundable ?? 0,
  };
}

class ClaimsApiService {
  async getClaims(query: ClaimsQuery = {}): Promise<ClaimsResponse> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.type) params.set('type', query.type);
    if (query.search) params.set('search', query.search);
    if (query.page) params.set('page', query.page.toString());
    if (query.pageSize) params.set('pageSize', query.pageSize.toString());

    const response = await apiClient.get<{
      data: BackendClaimListItem[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/admin/claims?${params.toString()}`);

    return {
      ...response.data,
      data: response.data.data.map(mapListItem),
    };
  }

  async getClaim(id: string): Promise<ClaimDetail> {
    const response = await apiClient.get<BackendClaimDetail>(`/admin/claims/${id}`);
    return mapDetail(response.data);
  }

  async resolveClaim(id: string, body: ResolveClaimBody): Promise<ClaimDetail> {
    const response = await apiClient.post<BackendClaimDetail>(`/admin/claims/${id}/resolve`, body);
    return mapDetail(response.data);
  }
}

export const claimsApiService = new ClaimsApiService();
