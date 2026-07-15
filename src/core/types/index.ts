// ─── Rôles back-office ──────────────────────────────────────────
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'COMMERCIAL_LOGISTICS' | 'SERVICE_CLIENT';

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  COMMERCIAL_LOGISTICS: 'Resp. Commercial & Logistique',
  SERVICE_CLIENT: 'Service Client',
};

// ─── Utilisateur authentifié ────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED';
  profilePhotoUrl?: string;
  createdAt: string;
}

// ─── Tokens ─────────────────────────────────────────────────────
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// ─── Commandes ──────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING_VALIDATION'
  | 'VALIDATED'
  | 'IN_PREPARATION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_VALIDATION: 'En attente de validation',
  VALIDATED: 'Validée',
  IN_PREPARATION: 'En fabrication',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  RETURNED: 'Retournée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_VALIDATION: '#FFC107',
  VALIDATED: '#2196F3',
  IN_PREPARATION: '#FF9800',
  SHIPPED: '#9C27B0',
  DELIVERED: '#4CAF50',
  CANCELLED: '#F44336',
  RETURNED: '#795548',
};

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Payé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
  PARTIALLY_REFUNDED: 'Partiellement remboursé',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: '#FFC107',
  CONFIRMED: '#4CAF50',
  FAILED: '#F44336',
  REFUNDED: '#2196F3',
  PARTIALLY_REFUNDED: '#9C27B0',
};

export type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MONEY' | 'MOOV_MONEY' | 'WAVE' | 'VISA' | 'MASTERCARD' | 'BANK_TRANSFER';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Money',
  MOOV_MONEY: 'Moov Money',
  WAVE: 'Wave',
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  BANK_TRANSFER: 'Virement bancaire',
};

export type DeliveryMode = 'STANDARD' | 'EXPRESS' | 'PICKUP';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productRef: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productImage?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerType: 'PARTICULIER' | 'PROFESSIONNEL';
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  amountHt?: number;
  tva?: number;
  deliveryMode: DeliveryMode;
  deliveryAddress?: string;
  deliveryNotes?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  driverId?: string;
  driverName?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Catégories produits ──────────────────────────────────────
export interface Category {
  id: string;
  slug: string;
  label: string;
  description?: string;
  iconName?: string;
  colorHex?: string;
  bgColorHex?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Produits ─────────────────────────────────────────────────
export type ProductStatus = 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';

export interface Product {
  id: string;
  reference: string;
  name: string;
  categoryId?: string;
  category?: Category;
  description?: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  weightKg?: number;
  unitPrice: number;
  bulkPrice?: number;
  bulkMinQuantity?: number;
  status: ProductStatus;
  usages: string[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

// ─── Stocks ─────────────────────────────────────────────────────
export type StockLevel = 'NORMAL' | 'ALERT' | 'CRITICAL';

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productRef: string;
  productImage?: string;
  realStock: number;
  availableStock: number;
  alertThreshold: number;
  criticalThreshold: number;
  level: StockLevel;
  updatedAt: string;
}

export type StockMovementType = 'SALE' | 'RECEPTION' | 'RETURN' | 'ADJUSTMENT' | 'TRANSFER' | 'RESERVATION' | 'CANCELLATION';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

// ─── Pré-commandes ──────────────────────────────────────────────
export type PreorderStatus = 'ACTIVE' | 'COMPLETED' | 'CONVERTED' | 'SUSPENDED' | 'CANCELLED';

export interface Preorder {
  id: string;
  preorderNumber: string;
  userId: string;
  customerName: string;
  customerCompany?: string;
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
  lockedPrice: number;
  paidAmount: number;
  status: PreorderStatus;
  startDate: string;
  endDate: string;
  nextDueDate?: string;
  nextDueAmount?: number;
  schedules: PreorderSchedule[];
  createdAt: string;
}

export type ScheduleStatus = 'UPCOMING' | 'DUE' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface PreorderSchedule {
  id: string;
  dueDate: string;
  amount: number;
  quantity: number;
  status: ScheduleStatus;
  paidAt?: string;
}

// ─── Clients ────────────────────────────────────────────────────
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  clientType: 'PARTICULIER' | 'PROFESSIONNEL';
  companyName?: string;
  totalOrders: number;
  totalRevenue: number;
  averageBasket: number;
  lastOrderDate?: string;
  createdAt: string;
}

// ─── Réclamations ───────────────────────────────────────────────
export type ClaimType =
  | 'DEFECTIVE_PRODUCT'
  | 'WRONG_PRODUCT'
  | 'DAMAGED_IN_TRANSIT'
  | 'MISSING_ITEMS'
  | 'DELIVERY_ISSUE'
  | 'PREORDER_REFUND'
  | 'CANCELLATION_REQUEST'
  | 'OTHER';

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  DEFECTIVE_PRODUCT: 'Produit défectueux',
  WRONG_PRODUCT: 'Mauvais produit',
  DAMAGED_IN_TRANSIT: 'Endommagé au transport',
  MISSING_ITEMS: 'Articles manquants',
  DELIVERY_ISSUE: 'Problème de livraison',
  PREORDER_REFUND: 'Remboursement pré-commande',
  CANCELLATION_REQUEST: 'Demande d\'annulation',
  OTHER: 'Autre',
};

export type ClaimStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  OPEN: 'Ouverte',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolue',
  CLOSED: 'Clôturée',
};

export interface Claim {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  type: ClaimType;
  description: string;
  status: ClaimStatus;
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
  photoUrls: string[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Logistique ─────────────────────────────────────────────────
export interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleType: string;
  capacity?: number;
  zones: string[];
  isActive: boolean;
  currentDeliveries: number;
  createdAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  baseFee: number;
  volumeSupplement: number;
  difficultyCoeff: number;
  standardDays: number;
  expressDays: number;
  isActive: boolean;
}

// ─── Dashboard KPI ──────────────────────────────────────────────
export interface DashboardKPI {
  revenue: number;
  revenueChange: number;
  ordersToday: number;
  ordersPending: number;
  averageBasket: number;
  averageBasketChange: number;
  activePreorders: number;
  preorderAmount: number;
  stockAlerts: number;
  stockCritical: number;
  deliveriesToday: number;
  deliveriesCompleted: number;
  deliveriesLate: number;
  unpaidSchedules: number;
  unpaidAmount: number;
}

// ─── Audit ──────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── Notifications ──────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  urgency: 'high' | 'medium' | 'info';
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Pagination ─────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Sidebar ────────────────────────────────────────────────────
export interface SidebarItem {
  key: string;
  icon: string;
  label: string;
  path: string;
  roles: Role[];
  badge?: number;
  children?: SidebarItem[];
}
