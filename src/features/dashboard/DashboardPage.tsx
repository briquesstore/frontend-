import { useState } from 'react';
import {
  TrendingUp, TrendingDown, ShoppingCart, DollarSign,
  Package, Truck, AlertTriangle, Clock, CreditCard, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/core/stores/auth.store';
import { formatCFA, formatPercentChange } from '@/core/utils/formatters';

// ─── API data ──────────────────────────────────────────────────
// TODO: Fetch from API endpoints
const REVENUE_DATA: any[] = [];
const ORDER_STATUS_DATA: any[] = [];
const TOP_PRODUCTS: any[] = [];
const PAYMENT_DATA: any[] = [];

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'quarter', label: 'Ce trimestre' },
  { key: 'year', label: 'Cette année' },
];

// ─── KPI Card ───────────────────────────────────────────────────
function KPICard({ title, value, change, icon, iconBg, suffix }: {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
            {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium',
              change >= 0 ? 'text-green-600' : 'text-red-500',
            )}>
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {formatPercentChange(change)} vs période préc.
            </div>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Alert Item ─────────────────────────────────────────────────
function AlertItem({ urgency, title, description, action, onClick }: {
  urgency: 'high' | 'medium' | 'info';
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  const colors = {
    high: 'border-l-red-500 bg-red-50/50',
    medium: 'border-l-yellow-500 bg-yellow-50/50',
    info: 'border-l-blue-500 bg-blue-50/50',
  };
  return (
    <div className={cn('border-l-4 rounded-r-lg p-3 flex items-center justify-between', colors[urgency])}>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button onClick={onClick} className="text-xs font-medium text-[#FF8C00] hover:underline whitespace-nowrap ml-4">
        {action}
      </button>
    </div>
  );
}

// ─── Service Client Dashboard ───────────────────────────────────
function ServiceClientDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Réclamations ouvertes" value="-" suffix="Chargement..." icon={<AlertTriangle size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <KPICard title="Assignées à moi" value="-" icon={<Package size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <KPICard title="Délai moyen traitement" value="-" suffix="Chargement..." icon={<Clock size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <KPICard title="Résolues ce mois" value="-" icon={<TrendingUp size={20} className="text-green-600" />} iconBg="bg-green-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Réclamations prioritaires</h3>
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('week');
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'SERVICE_CLIENT') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Bienvenue, {user.firstName} — Service Client</p>
        </div>
        <ServiceClientDashboard />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                period === p.key ? 'bg-[#FF8C00] text-white' : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Chiffre d'affaires"
          value="-"
          icon={<DollarSign size={20} className="text-green-600" />}
          iconBg="bg-green-100"
        />
        <KPICard
          title="Commandes du jour"
          value="-"
          icon={<ShoppingCart size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <KPICard
          title="Panier moyen"
          value="-"
          icon={<CreditCard size={20} className="text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <KPICard
          title="Pré-commandes actives"
          value="-"
          icon={<Calendar size={20} className="text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Alertes stock"
          value="-"
          icon={<Package size={20} className="text-yellow-600" />}
          iconBg="bg-yellow-100"
        />
        <KPICard
          title="Livraisons du jour"
          value="-"
          icon={<Truck size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-100"
        />
        <KPICard
          title="Livraisons en retard"
          value="-"
          icon={<Clock size={20} className="text-red-600" />}
          iconBg="bg-red-100"
        />
        <KPICard
          title="Échéances impayées"
          value="-"
          icon={<AlertTriangle size={20} className="text-red-600" />}
          iconBg="bg-red-100"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Évolution du CA</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: any) => formatCFA(v)} />
              <Area type="monotone" dataKey="current" stroke="#FF8C00" fill="#FF8C0020" strokeWidth={2} name="Période actuelle" />
              <Area type="monotone" dataKey="previous" stroke="#94a3b8" fill="#94a3b810" strokeWidth={1.5} strokeDasharray="4 4" name="Période précédente" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Donut */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Commandes par statut</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ORDER_STATUS_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {ORDER_STATUS_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v} commandes`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
            {ORDER_STATUS_DATA.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 truncate">{item.name}</span>
                <span className="font-semibold text-gray-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Top 7 produits vendus</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} unités`} />
              <Bar dataKey="sold" fill="#FF8C00" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Modes de paiement</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={PAYMENT_DATA} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                {PAYMENT_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {PAYMENT_DATA.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 flex-1">{item.name}</span>
                <div className="w-24 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                </div>
                <span className="font-semibold text-gray-900 w-8 text-right">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Alertes & actions rapides</h3>
        <p className="text-sm text-gray-500">Chargement...</p>
      </div>
    </div>
  );
}
