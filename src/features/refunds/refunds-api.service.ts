import { apiClient } from '@/lib/api-client';
import type { RefundStatus, RefundReason } from '@/core/types';

export interface RefundUser {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export interface RefundPayment {
  id: string;
  amount: number;
  method?: string;
}

export interface RefundOrder {
  id: string;
  orderNumber?: string;
}

export interface RefundPreorder {
  id: string;
}

export interface RefundListItem {
  id: string;
  number: string;
  amount: number;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetails?: string;
  createdAt: string;
  processedAt?: string;
  customerName: string;
  customerId: string;
  orderNumber?: string;
  preorderNumber?: string;
  paymentAmount: number;
}

export interface RefundDetail {
  id: string;
  number: string;
  amount: number;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetails?: string;
  createdAt: string;
  processedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  initiatedBy: string;
  initiatedByType: string;
  providerRefundId?: string;
  failureReason?: string;
  customer: RefundUser;
  payment: RefundPayment;
  order?: RefundOrder;
  preorder?: RefundPreorder;
}

export interface RefundsQuery {
  status?: RefundStatus;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}

export interface RefundsResponse {
  data: RefundListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface BackendRefundListItem {
  id: string;
  amount: number;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetails?: string;
  createdAt: string;
  processedAt?: string;
  initiatedBy: string;
  initiatedByType: string;
  payment: {
    id: string;
    amount: number;
    method?: string;
    order?: { user?: RefundUser } | null;
    preorder?: { user?: RefundUser } | null;
  };
  order?: { id: string; orderNumber?: string | null } | null;
  preorder?: { id: string } | null;
}

interface BackendRefundDetail {
  id: string;
  amount: number;
  status: RefundStatus;
  reason: RefundReason;
  reasonDetails?: string;
  createdAt: string;
  processedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  initiatedBy: string;
  initiatedByType: string;
  providerRefundId?: string;
  failureReason?: string;
  payment: {
    id: string;
    amount: number;
    method?: string;
    order?: { user?: RefundUser } | null;
    preorder?: { user?: RefundUser } | null;
  };
  order?: { id: string; orderNumber?: string | null } | null;
  preorder?: { id: string } | null;
}

function buildNumber(id: string): string {
  return `REM-${id.substring(0, 8).toUpperCase()}`;
}

function buildCustomerName(user?: RefundUser): string {
  if (!user) return 'Inconnu';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Inconnu';
}

function getUserFromBackend(item: BackendRefundListItem | BackendRefundDetail): RefundUser | undefined {
  return item.payment?.order?.user || item.payment?.preorder?.user;
}

function mapListItem(item: BackendRefundListItem): RefundListItem {
  const user = getUserFromBackend(item);
  const order = item.order || undefined;
  const preorder = item.preorder || undefined;

  return {
    id: item.id,
    number: buildNumber(item.id),
    amount: item.amount,
    status: item.status,
    reason: item.reason,
    reasonDetails: item.reasonDetails,
    createdAt: item.createdAt,
    processedAt: item.processedAt,
    customerName: buildCustomerName(user),
    customerId: user?.id || '',
    orderNumber: order?.orderNumber || undefined,
    preorderNumber: preorder ? `PRÉ-${preorder.id.substring(0, 8).toUpperCase()}` : undefined,
    paymentAmount: item.payment?.amount || 0,
  };
}

function mapDetail(item: BackendRefundDetail): RefundDetail {
  const user = getUserFromBackend(item);
  const order = item.order || undefined;
  const preorder = item.preorder || undefined;

  return {
    id: item.id,
    number: buildNumber(item.id),
    amount: item.amount,
    status: item.status,
    reason: item.reason,
    reasonDetails: item.reasonDetails,
    createdAt: item.createdAt,
    processedAt: item.processedAt,
    approvedAt: item.approvedAt,
    approvedBy: item.approvedBy,
    initiatedBy: item.initiatedBy,
    initiatedByType: item.initiatedByType,
    providerRefundId: item.providerRefundId,
    failureReason: item.failureReason,
    customer: user || { id: '', firstName: 'Inconnu', lastName: '' },
    payment: {
      id: item.payment?.id || '',
      amount: item.payment?.amount || 0,
      method: item.payment?.method,
    },
    order: order ? { id: order.id, orderNumber: order.orderNumber || undefined } : undefined,
    preorder: preorder ? { id: preorder.id } : undefined,
  };
}

class RefundsApiService {
  async getRefunds(query: RefundsQuery = {}): Promise<RefundsResponse> {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.minAmount) params.set('minAmount', query.minAmount.toString());
    if (query.maxAmount) params.set('maxAmount', query.maxAmount.toString());
    if (query.page) params.set('page', query.page.toString());
    if (query.pageSize) params.set('pageSize', query.pageSize.toString());

    const response = await apiClient.get<{
      data: BackendRefundListItem[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/admin/refunds?${params.toString()}`);

    return {
      ...response.data,
      data: response.data.data.map(mapListItem),
    };
  }

  async getRefund(id: string): Promise<RefundDetail> {
    const response = await apiClient.get<BackendRefundDetail>(`/admin/refunds/${id}`);
    return mapDetail(response.data);
  }

  async markResolved(id: string, transferReference: string): Promise<RefundDetail> {
    const response = await apiClient.post<BackendRefundDetail>(`/admin/refunds/${id}/mark-resolved`, {
      transferReference,
    });
    return mapDetail(response.data);
  }

  async cancelRefund(id: string, reason: string): Promise<RefundDetail> {
    const response = await apiClient.post<BackendRefundDetail>(`/admin/refunds/${id}/cancel`, { reason });
    return mapDetail(response.data);
  }
}

export const refundsApiService = new RefundsApiService();
