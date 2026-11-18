import { apiClient } from '@/lib/api-client';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  clientType: 'PARTICULIER' | 'PROFESSIONNEL';
  companyName?: string;
  createdAt: string;
  totalOrders: number;
  totalRevenue: number;
  lastOrderDate?: string;
}

export interface CustomerProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  label: string;
  fullAddress: string;
  landmarks?: string;
  city: string;
  commune?: string;
  gpsLat?: number;
  gpsLng?: number;
  contactName: string;
  contactPhone: string;
  driverInstructions?: string;
  relayContactName?: string;
  relayContactPhone?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface CustomerClaim {
  id: string;
  number: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface CustomerReferrer {
  id: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}

export interface CustomerReferral {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  phoneVerified: boolean;
}

export interface CustomerDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  clientType: 'PARTICULIER' | 'PROFESSIONNEL';
  companyName?: string;
  taxId?: string;
  sector?: string;
  createdAt: string;
  totalOrders: number;
  totalRevenue: number;
  averageBasket: number;
  lastOrderDate?: string;
  referralCode?: string;
  isSalesAgent: boolean;
  salesAgentSince?: string;
  referredBy?: CustomerReferrer;
  referredAt?: string;
  referrals: CustomerReferral[];
  projects: CustomerProject[];
  recentOrders: CustomerOrder[];
  claims: CustomerClaim[];
  notes: any[];
}

export interface SalesAgentRank {
  agentId: string;
  nom: string;
  salesAgentSince?: string;
  inscrits: number;
  clients: number;
  caTotal: number;
  periode: { from: string | null; to: string | null };
}

export interface CustomersListResponse {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class CustomersApiService {
  async getCustomers(params: {
    search?: string;
    clientType?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<CustomersListResponse> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.clientType) queryParams.append('clientType', params.clientType);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const queryString = queryParams.toString();
    const endpoint = `/admin/customers${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get<CustomersListResponse>(endpoint);
    return response.data;
  }

  async getCustomerDetail(id: string): Promise<CustomerDetail> {
    const response = await apiClient.get<CustomerDetail>(`/admin/customers/${id}`);
    return response.data;
  }

  async toggleSalesAgent(id: string, activate: boolean) {
    const response = await apiClient.patch(`/admin/customers/${id}/sales-agent`, {
      activate,
    });
    return response.data;
  }

  async getSalesAgentsRanking(params: { from?: string; to?: string } = {}): Promise<SalesAgentRank[]> {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    const queryString = queryParams.toString();
    const response = await apiClient.get<SalesAgentRank[]>(
      `/admin/sales-agents/ranking${queryString ? `?${queryString}` : ''}`,
    );
    return response.data;
  }
}

export const customersApiService = new CustomersApiService();
