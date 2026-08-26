import api from '@/core/api/client';

export interface Driver {
  id: string;
  phone: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  vehicleType: string;
  capacity?: number;
  zones?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orders?: {
    id: string;
    orderNumber: string;
    status: string;
    deliveryStatus: string;
  }[];
}

export interface CreateDriverDto {
  phone: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  vehicleType: string;
  capacity?: number;
  zones?: string[];
  isActive?: boolean;
}

export interface UpdateDriverDto {
  vehicleType?: string;
  capacity?: number;
  zones?: string[];
  isActive?: boolean;
}

export interface DriversResponse {
  data: Driver[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const driversApiService = {
  // Récupérer tous les drivers (paginés)
  async getDrivers(params?: { page?: number; pageSize?: number }): Promise<DriversResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    const url = `/drivers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const { data } = await api.get(url);
    return data as DriversResponse;
  },

  // Récupérer les drivers actifs
  async getActiveDrivers(): Promise<Driver[]> {
    const { data } = await api.get('/drivers/active');
    return data as Driver[];
  },

  // Récupérer un driver par ID
  async getDriver(id: string): Promise<Driver> {
    const { data } = await api.get(`/drivers/${id}`);
    return data as Driver;
  },

  // Créer un driver
  async createDriver(dto: CreateDriverDto): Promise<Driver> {
    const { data } = await api.post('/drivers', dto);
    return data as Driver;
  },

  // Mettre à jour un driver
  async updateDriver(id: string, dto: UpdateDriverDto): Promise<Driver> {
    const { data } = await api.patch(`/drivers/${id}`, dto);
    return data as Driver;
  },

  // Supprimer un driver (soft delete)
  async deleteDriver(id: string): Promise<void> {
    await api.delete(`/drivers/${id}`);
  },
};
