import type { Role } from './types';

// Modules accessibles par rôle
const MODULE_ACCESS: Record<string, Role[]> = {
  dashboard:   ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS', 'SERVICE_CLIENT'],
  orders:      ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS', 'SERVICE_CLIENT'],
  preorders:   ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS', 'SERVICE_CLIENT'],
  products:    ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS'],
  stock:       ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS'],
  logistics:   ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS'],
  customers:   ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS', 'SERVICE_CLIENT'],
  claims:      ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS', 'SERVICE_CLIENT'],
  refunds:     ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS', 'SERVICE_CLIENT'],
  reports:     ['SUPER_ADMIN', 'ADMIN', 'COMMERCIAL_LOGISTICS'],
  waitlist:    ['SUPER_ADMIN', 'ADMIN'],
  settings:    ['SUPER_ADMIN', 'ADMIN'],
};

export function hasModuleAccess(role: Role, module: string): boolean {
  return MODULE_ACCESS[module]?.includes(role) ?? false;
}

// Permissions fines
type Permission =
  | 'orders.update_status'
  | 'orders.add_notes'
  | 'orders.cancel'
  | 'preorders.manage'
  | 'products.create'
  | 'products.edit'
  | 'stock.entry'
  | 'stock.adjust'
  | 'logistics.assign'
  | 'logistics.manage_drivers'
  | 'customers.edit'
  | 'customers.notes'
  | 'claims.assign'
  | 'claims.resolve'
  | 'claims.read_only'
  | 'refunds.manage'
  | 'refunds.read_only'
  | 'reports.export'
  | 'settings.manage_users'
  | 'settings.system';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'orders.update_status', 'orders.add_notes', 'orders.cancel',
    'preorders.manage',
    'products.create', 'products.edit',
    'stock.entry', 'stock.adjust',
    'logistics.assign', 'logistics.manage_drivers',
    'customers.edit', 'customers.notes',
    'claims.assign', 'claims.resolve',
    'refunds.manage',
    'reports.export',
    'settings.manage_users', 'settings.system',
  ],
  ADMIN: [
    'orders.update_status', 'orders.add_notes', 'orders.cancel',
    'preorders.manage',
    'products.create', 'products.edit',
    'stock.entry', 'stock.adjust',
    'logistics.assign', 'logistics.manage_drivers',
    'customers.edit', 'customers.notes',
    'claims.assign', 'claims.resolve',
    'refunds.manage',
    'reports.export',
    'settings.manage_users',
  ],
  COMMERCIAL_LOGISTICS: [
    'orders.update_status', 'orders.add_notes', 'orders.cancel',
    'preorders.manage',
    'products.create', 'products.edit',
    'stock.entry', 'stock.adjust',
    'logistics.assign', 'logistics.manage_drivers',
    'customers.edit', 'customers.notes',
    'claims.read_only',
    'refunds.read_only',
    'reports.export',
  ],
  SERVICE_CLIENT: [
    'orders.add_notes',
    'customers.notes',
    'claims.assign', 'claims.resolve',
    'refunds.read_only',
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export { MODULE_ACCESS };
export type { Permission };
