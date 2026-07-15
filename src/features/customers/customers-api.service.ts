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
  projects: CustomerProject[];
  recentOrders: CustomerOrder[];
  claims: CustomerClaim[];
  notes: any[];
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
}

export const customersApiService = new CustomersApiService();
