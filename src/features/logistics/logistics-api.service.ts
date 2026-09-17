import { apiClient } from '@/lib/api-client';

export type DeliveryStatusFilter = 'ALL' | 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'IN_PROGRESS' | 'ARRIVED' | 'CODE_VERIFIED' | 'DELIVERED' | 'FAILED';

export interface DeliveryRow {
  id: string;
  orderNumber: string;
  customerName: string;
  phone?: string;
  address: string;
  city?: string;
  commune?: string;
  zone?: string;
  projectName?: string;
  contactName?: string;
  contactPhone?: string;
  landmarks?: string;
  driverInstructions?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  scheduledAt?: string;
  status: 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'IN_PROGRESS' | 'ARRIVED' | 'CODE_VERIFIED' | 'DELIVERED' | 'FAILED';
  deliveryValidationCode?: string;
  orderStatus?: string;
  deliveryNotes?: string;
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
  status: string;
  user?: { firstName: string; lastName: string; phone?: string };
  deliveryAddress?: {
    id: string;
    name: string;
    fullAddress: string;
    city: string;
    commune?: string;
    landmarks?: string;
    contactName: string;
    contactPhone: string;
    driverInstructions?: string;
    gpsLat?: number;
    gpsLng?: number;
  };
  driverId?: string;
  driver?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  deliveryScheduledAt?: string;
  deliveryStatus: string | null;
  deliveryValidationCode?: string;
  deliveryCodeExpiresAt?: string;
  deliveryNotes?: string;
  proof?: {
    recipientName?: string;
    recipientPhone?: string;
    recipientRelation?: string;
    signature?: string;
    photo?: string;
  };
}

function mapDelivery(item: BackendDelivery): DeliveryRow {
  const addr = item.deliveryAddress;
  
  // Si pas de deliveryStatus et pas de driver, c'est en attente d'assignation
  const status = item.deliveryStatus || (item.driverId ? 'ASSIGNED' : 'PENDING_ASSIGNMENT');
  
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    customerName: item.user ? `${item.user.firstName} ${item.user.lastName}`.trim() : '—',
    phone: item.user?.phone,
    address: addr?.fullAddress || 'Non spécifiée',
    city: addr?.city,
    commune: addr?.commune,
    zone: addr?.city,
    projectName: addr?.name,
    contactName: addr?.contactName,
    contactPhone: addr?.contactPhone,
    landmarks: addr?.landmarks,
    driverInstructions: addr?.driverInstructions,
    driverId: item.driverId,
    driverName: item.driver ? `${item.driver.firstName} ${item.driver.lastName}`.trim() : undefined,
    driverPhone: item.driver?.phone,
    scheduledAt: item.deliveryScheduledAt,
    status: status as DeliveryRow['status'],
    deliveryValidationCode: item.deliveryValidationCode,
    orderStatus: item.status,
    deliveryNotes: item.deliveryNotes,
  };
}

function mapDeliveryDetail(item: BackendDelivery): DeliveryDetail {
  const addr = item.deliveryAddress;
  const status = item.deliveryStatus || (item.driverId ? 'ASSIGNED' : 'PENDING_ASSIGNMENT');
  
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    customerName: item.user ? `${item.user.firstName} ${item.user.lastName}`.trim() : '—',
    phone: item.user?.phone,
    address: addr?.fullAddress || 'Non spécifiée',
    zone: addr?.city,
    driverName: item.driver ? `${item.driver.firstName} ${item.driver.lastName}`.trim() : undefined,
    driverPhone: item.driver?.phone,
    scheduledAt: item.deliveryScheduledAt,
    status,
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

  async getZones(): Promise<ZoneRow[]> {
    // TODO: Connecter à un endpoint backend réel quand disponible
    return [];
  }
}

export const logisticsApiService = new LogisticsApiService();
