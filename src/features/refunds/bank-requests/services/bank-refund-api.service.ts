import { apiClient } from '@/lib/api-client';

export interface BankRefundRequest {
  id: string;
  userId: string;
  refundId: string;
  amount: number;
  status: string;
  isDiaspora: boolean;
  ribHolderName?: string;
  ribIban?: string;
  ribBankName?: string;
  ribBic?: string;
  ribDocumentUrl?: string;
  idDocumentRectoUrl?: string;
  idDocumentVersoUrl?: string;
  assignedAgentId?: string;
  reviewStartedAt?: string;
  reviewCompletedAt?: string;
  rejectionReason?: string;
  agentNotes?: string;
  checklistCompleted?: ChecklistItem[];
  paidAt?: string;
  paymentReference?: string;
  documentsSubmittedAt?: string;
  slaDeadline?: string;
  slaRemainingDays?: number;
  slaStatus?: 'green' | 'orange' | 'red';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  refund?: {
    id: string;
    amount: number;
    reason: string;
    status: string;
  };
  assignedAgent?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  // Signed URLs pour les documents (admin uniquement)
  ribDocumentSignedUrl?: string;
  idDocumentRectoSignedUrl?: string;
  idDocumentVersoSignedUrl?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked?: boolean;
}

export interface BankRefundQueryParams {
  status?: string;
  assignedAgentId?: string;
  isDiaspora?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApproveDto {
  notes: string;
  checklist: { id: string; checked: boolean }[];
}

export interface RejectDto {
  reason: string;
  notes?: string;
}

export interface MarkPaidDto {
  paymentReference: string;
  notes?: string;
}

class BankRefundApiService {
  private basePath = '/admin/bank-refunds';

  private buildQueryString(params?: BankRefundQueryParams): string {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.assignedAgentId) searchParams.set('assignedAgentId', params.assignedAgentId);
    if (params.isDiaspora !== undefined) searchParams.set('isDiaspora', String(params.isDiaspora));
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }

  async getAll(params?: BankRefundQueryParams): Promise<PaginatedResponse<BankRefundRequest>> {
    const response = await apiClient.get<PaginatedResponse<BankRefundRequest>>(`${this.basePath}${this.buildQueryString(params)}`);
    return response.data;
  }

  async getById(id: string): Promise<BankRefundRequest> {
    const response = await apiClient.get<BankRefundRequest>(`${this.basePath}/${id}`);
    return response.data;
  }

  async getChecklist(): Promise<{ checklist: ChecklistItem[] }> {
    const response = await apiClient.get<{ checklist: ChecklistItem[] }>(`${this.basePath}/checklist`);
    return response.data;
  }

  async assign(id: string, notes?: string): Promise<void> {
    await apiClient.post(`${this.basePath}/${id}/assign`, { notes });
  }

  async approve(id: string, dto: ApproveDto): Promise<void> {
    await apiClient.post(`${this.basePath}/${id}/approve`, dto);
  }

  async reject(id: string, dto: RejectDto): Promise<void> {
    await apiClient.post(`${this.basePath}/${id}/reject`, dto);
  }

  async markPaid(id: string, dto: MarkPaidDto): Promise<void> {
    await apiClient.post(`${this.basePath}/${id}/mark-paid`, dto);
  }
}

export const bankRefundApiService = new BankRefundApiService();
