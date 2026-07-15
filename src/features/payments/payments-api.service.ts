import { apiClient } from '@/lib/api-client';

export type PaymentStatus = 'CONFIRMED' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type PaymentType = 'ORDER' | 'PREORDER_INSTALLMENT';

export interface Payment {
  id: string;
  reference: string;
  orderNumber?: string;
  customerName: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  type: PaymentType;
  installmentLabel?: string;
  createdAt: string;
}

export interface OverdueInstallment {
  id: string;
  preorderNumber: string;
  customerName: string;
  phone: string;
  amount: number;
  dueDate: string;
  daysPastDue: number;
  installmentLabel: string;
}

export interface PaymentsResponse {
  data: Payment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statistics: {
    confirmedTotal: number;
    pendingTotal: number;
  };
}

export interface OverdueInstallmentsResponse {
  overdueInstallments: OverdueInstallment[];
  totalOverdue: number;
  count: number;
}

export class PaymentsApiService {
  async getAllPayments(params: {
    page?: number;
    pageSize?: number;
    type?: PaymentType;
    status?: PaymentStatus;
    search?: string;
  }): Promise<PaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = `/admin/payments${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<PaymentsResponse>(endpoint);
    return response.data;
  }

  async getOverdueInstallments(): Promise<OverdueInstallmentsResponse> {
    const response = await apiClient.get<OverdueInstallmentsResponse>('/admin/payments/overdue');
    return response.data;
  }
}

export const paymentsApiService = new PaymentsApiService();
