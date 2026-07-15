import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/core/stores/auth.store';

export type InvoiceStatus = 'ISSUED' | 'DRAFT' | 'CANCELLED';
export type InvoiceType = 'ACOMPTE' | 'FINALE' | 'AVOIR';

export interface InvoiceLine {
  id: string;
  designation: string;
  reference?: string;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  amountHt: number;
  amountVat: number;
  amountTtc: number;
  vatRate: number;
  position: number;
}

export interface Invoice {
  id: string;
  number: string;
  orderNumber?: string;
  preorderNumber?: string;
  customerName: string;
  customerType: 'PARTICULIER' | 'PROFESSIONNEL';
  amountHT: number;
  tva: number;
  totalTTC: number;
  status: InvoiceStatus;
  type: InvoiceType;
  issuedAt: string;
  dueDate?: string;
  paidAt?: string;
  amountPaid: number;
  balanceDue: number;
  lines: InvoiceLine[];
}

export interface InvoicesResponse {
  data: Invoice[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoiceStatsResponse {
  totals: {
    totalHt: number;
    totalTtc: number;
    totalVat: number;
    count: number;
  };
  byType: { type: string; _sum: { totalTtc: number }; _count: number }[];
  byMonth: { month: Date; total_ht: number; total_ttc: number; count: number }[];
}

export class InvoicesApiService {
  async getAllInvoices(params: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    type?: InvoiceType;
    search?: string;
  } = {}): Promise<InvoicesResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.type) queryParams.append('type', params.type);

    const queryString = queryParams.toString();
    const endpoint = `/admin/invoices${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<InvoicesResponse>(endpoint);

    // Transform backend data to match frontend Invoice interface
    return {
      ...response.data,
      data: response.data.data.map((invoice: any) => this.transformInvoice(invoice)),
    };
  }

  async getStats(): Promise<InvoiceStatsResponse> {
    const response = await apiClient.get<InvoiceStatsResponse>('/admin/invoices/stats/summary');
    return response.data;
  }

  async downloadInvoice(id: string, number: string): Promise<void> {
    const blob = await this.fetchInvoiceBlob(id);
    const contentType = blob.type || 'application/pdf';
    const extension = contentType.includes('pdf') ? 'pdf' : 'html';

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${number}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  async viewInvoice(id: string): Promise<string> {
    const blob = await this.fetchInvoiceBlob(id);
    return URL.createObjectURL(blob);
  }

  private async fetchInvoiceBlob(id: string): Promise<Blob> {
    const token = useAuthStore.getState().accessToken;
    const url = `${apiClient.getBaseUrl()}/admin/invoices/${id}/download`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur lors du téléchargement de la facture' }));
      throw new Error(error.message || 'Erreur lors du téléchargement de la facture');
    }

    return response.blob();
  }

  private transformInvoice(invoice: any): Invoice {
    const customerSnapshot = invoice.customerSnapshot || {};
    const customerName = customerSnapshot.companyName || `${customerSnapshot.firstName || ''} ${customerSnapshot.lastName || ''}`.trim() || 'Inconnu';
    const customerType = customerSnapshot.type || 'PARTICULIER';

    return {
      id: invoice.id,
      number: invoice.number,
      orderNumber: invoice.order?.orderNumber || undefined,
      preorderNumber: invoice.preorder ? `PRE-${invoice.preorder.id.slice(0, 8).toUpperCase()}` : undefined,
      customerName,
      customerType: customerType === 'PROFESSIONNEL' ? 'PROFESSIONNEL' : 'PARTICULIER',
      amountHT: invoice.totalHt,
      tva: invoice.totalVat,
      totalTTC: invoice.totalTtc,
      status: invoice.status,
      type: invoice.type,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
      lines: invoice.lines || [],
    };
  }
}

export const invoicesApiService = new InvoicesApiService();
