import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Truck,
  Users,
  AlertTriangle,
  LineChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Tag,
  FileText,
  Bell,
  RotateCcw,
  MessageCircle,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/core/stores/auth.store';
import { useSidebarStore } from '@/core/stores/sidebar.store';
import { hasModuleAccess } from '@/core/permissions';
import type { Role } from '@/core/types';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  module: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, module: 'dashboard' },
  { key: 'orders', label: 'Commandes', path: '/admin/orders', icon: <ShoppingCart size={20} />, module: 'orders' },
  { key: 'preorders', label: 'Pré-commandes', path: '/admin/preorders', icon: <ClipboardList size={20} />, module: 'preorders' },
  { key: 'payments', label: 'Paiements', path: '/admin/payments', icon: <CreditCard size={20} />, module: 'orders' },
  { key: 'invoices', label: 'Factures', path: '/admin/invoices', icon: <FileText size={20} />, module: 'orders' },
  { key: 'products', label: 'Catalogue', path: '/admin/products', icon: <Package size={20} />, module: 'products' },
  { key: 'promotions', label: 'Promotions', path: '/admin/promotions', icon: <Tag size={20} />, module: 'products' },
  { key: 'logistics', label: 'Logistique', path: '/admin/logistics', icon: <Truck size={20} />, module: 'logistics' },
  { key: 'drivers', label: 'Livreurs', path: '/admin/drivers', icon: <Truck size={20} />, module: 'logistics' },
  { key: 'customers', label: 'Clients', path: '/admin/customers', icon: <Users size={20} />, module: 'customers' },
  { key: 'claims', label: 'Réclamations', path: '/admin/claims', icon: <AlertTriangle size={20} />, module: 'claims' },
  { key: 'refunds', label: 'Remboursements', path: '/admin/refunds', icon: <RotateCcw size={20} />, module: 'refunds' },
  { key: 'waitlist', label: 'Liste d\'attente', path: '/admin/waitlist', icon: <Mail size={20} />, module: 'waitlist' },
  { key: 'notifications', label: 'Notifications Push', path: '/admin/notifications', icon: <Bell size={20} />, module: 'settings' },
  { key: 'whatsapp', label: 'WhatsApp', path: '/admin/whatsapp', icon: <MessageCircle size={20} />, module: 'settings' },
  { key: 'messaging', label: 'Messagerie', path: '/admin/messaging', icon: <MessageSquare size={20} />, module: 'messaging' },
  { key: 'reports', label: 'Rapports', path: '/admin/reports', icon: <LineChart size={20} />, module: 'reports' },
  { key: 'settings', label: 'Paramètres', path: '/admin/settings', icon: <Settings size={20} />, module: 'settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { collapsed, toggle } = useSidebarStore();

  const role = user?.role as Role | undefined;
  const visibleItems = role
    ? NAV_ITEMS.filter((item) => hasModuleAccess(role, item.module))
    : [];

  return (
    <aside
      className={cn(
        'h-screen bg-[#1E1E2D] text-white flex flex-col transition-all duration-300 fixed left-0 top-0 z-40',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Logo + Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center overflow-hidden">
          <img src="/logo.png" alt="BRIQUES.STORE" className="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <span className="font-bold text-sm tracking-wide">BRIQUES</span>
              <span className="font-bold text-sm tracking-wide text-[#FF8C00]">.STORE</span>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          title={collapsed ? 'Déplier' : 'Réduire'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto custom-scrollbar-dark">
        <ul className="space-y-0.5 px-2.5">
          {visibleItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

            return (
              <li key={item.key}>
                <button
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative',
                    isActive
                      ? 'bg-[#FF8C00] text-white shadow-sm shadow-[#FF8C00]/20 font-semibold'
                      : 'text-gray-300 hover:text-white hover:bg-white/5',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <span className={cn(
                    'flex-shrink-0 transition-transform group-hover:scale-105',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'
                  )}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="truncate tracking-wide text-[13.5px]">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge != null && item.badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#1E1E2D]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
