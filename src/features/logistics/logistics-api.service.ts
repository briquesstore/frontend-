import { apiClient } from '@/lib/api-client';

export interface DeliveryRow {
  id: string;
  orderNumber: string;
  customerName: string;
  phone?: string;
  address: string;
  zone?: string;
  driverName?: string;
  driverPhone?: string;
  scheduledAt?: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'ARRIVED' | 'CODE_VERIFIED' | 'DELIVERED' | 'FAILED';
  deliveryValidationCode?: string;
}

export interface DeliveryDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  phone?: string;
  address: string;
  zone?: string;
  driverName?: string;
  driverPhone?: string;
  scheduledAt?: string;
  status: string;
  deliveryValidationCode?: string;
  deliveryCodeExpiresAt?: string;
  proof?: {
    recipientName?: string;
    recipientPhone?: string;
    recipientRelation?: string;
    signature?: string;
    photo?: string;
  };
}

export interface DriverRow {
  id: string;
  name: string;
  phone: string;
  vehicleType?: string;
  capacity?: string;
  zones?: string[];
  isActive: boolean;
  currentDeliveries: number;
}

export interface ZoneRow {
  id: string;
  name: string;
  baseFee: number;
  standardDays: number;
  expressDays: number;
  isActive: boolean;
}

interface BackendDelivery {
  id: string;
  orderNumber: string;
  user: { firstName: string; lastName: string; phone?: string };
  deliveryAddress: {
    street?: string;
    city?: string;
    region?: string;
  };
  driver?: {
    user: { firstName: string; lastName: string; phone?: string };
  };
  deliveryScheduledAt?: string;
  deliveryStatus: string;
  deliveryValidationCode?: string;
  deliveryCodeExpiresAt?: string;
  proof?: {
    recipientName?: string;
    recipientPhone?: string;
    recipientRelation?: string;
    signature?: string;
    photo?: string;
  };
}

function mapDelivery(item: BackendDelivery): DeliveryRow {
  const addressParts = [
    item.deliveryAddress?.street,
    item.deliveryAddress?.city,
    item.deliveryAddress?.region,
  ].filter(Boolean);
  
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    customerName: `${item.user.firstName} ${item.user.lastName}`.trim(),
    phone: item.user.phone,
    address: addressParts.join(', ') || 'Non spécifiée',
    zone: item.deliveryAddress?.region,
    driverName: item.driver ? `${item.driver.user.firstName} ${item.driver.user.lastName}`.trim() : undefined,
    driverPhone: item.driver?.user.phone,
    scheduledAt: item.deliveryScheduledAt,
    status: item.deliveryStatus as any,
    deliveryValidationCode: item.deliveryValidationCode,
  };
}

function mapDeliveryDetail(item: BackendDelivery): DeliveryDetail {
  const addressParts = [
    item.deliveryAddress?.street,
    item.deliveryAddress?.city,
    item.deliveryAddress?.region,
  ].filter(Boolean);
  
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    customerName: `${item.user.firstName} ${item.user.lastName}`.trim(),
    phone: item.user.phone,
    address: addressParts.join(', ') || 'Non spécifiée',
    zone: item.deliveryAddress?.region,
    driverName: item.driver ? `${item.driver.user.firstName} ${item.driver.user.lastName}`.trim() : undefined,
    driverPhone: item.driver?.user.phone,
    scheduledAt: item.deliveryScheduledAt,
    status: item.deliveryStatus,
    deliveryValidationCode: item.deliveryValidationCode,
    deliveryCodeExpiresAt: item.deliveryCodeExpiresAt,
    proof: item.proof,
  };
}

class LogisticsApiService {
  async getDeliveries(status?: string): Promise<DeliveryRow[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    
    const response = await apiClient.get<BackendDelivery[]>(`/admin/deliveries?${params.toString()}`);
    return response.data.map(mapDelivery);
  }

  async getDelivery(id: string): Promise<DeliveryDetail> {
    const response = await apiClient.get<BackendDelivery>(`/admin/deliveries/${id}`);
    return mapDeliveryDetail(response.data);
  }

  async assignDriver(orderId: string, driverId: string, scheduledAt?: string): Promise<DeliveryRow> {
    const response = await apiClient.post<BackendDelivery>(`/admin/deliveries/${orderId}/assign-driver`, {
      driverId,
      scheduledAt,
    });
    return mapDelivery(response.data);
  }

  async scheduleDelivery(orderId: string, scheduledAt: string): Promise<DeliveryRow> {
    const response = await apiClient.patch<BackendDelivery>(`/admin/deliveries/${orderId}/schedule`, {
      scheduledAt,
    });
    return mapDelivery(response.data);
  }

  async regenerateCode(orderId: string): Promise<DeliveryRow> {
    const response = await apiClient.post<BackendDelivery>(`/admin/deliveries/${orderId}/regenerate-code`);
    return mapDelivery(response.data);
  }

  // Pour les livreurs et zones, nous aurons besoin d'endpoints dédiés
  // Pour l'instant, on garde les mocks ou on créera les endpoints backend plus tard
  async getDrivers(): Promise<DriverRow[]> {
    // TODO: Connecter à un endpoint backend réel quand disponible
    return [];
  }

  async getZones(): Promise<ZoneRow[]> {
    // TODO: Connecter à un endpoint backend réel quand disponible
    return [];
  }
}

export const logisticsApiService = new LogisticsApiService();
