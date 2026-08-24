import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Tag, Calendar, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCFA, formatDate } from '@/core/utils/formatters';

type PromoStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED';

interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  currentUses: number;
  status: PromoStatus;
  startDate: string;
  endDate: string;
  applicableProducts: string;
}

const STATUS_CONFIG: Record<PromoStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: 'text-green-700', bg: 'bg-green-50' },
  SCHEDULED: { label: 'Programmée', color: 'text-blue-700', bg: 'bg-blue-50' },
  EXPIRED: { label: 'Expirée', color: 'text-gray-500', bg: 'bg-gray-100' },
  DISABLED: { label: 'Désactivée', color: 'text-red-700', bg: 'bg-red-50' },
};

// TODO: Fetch from API endpoints
const MOCK_PROMOS: Promotion[] = [];

export default function PromotionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromoStatus | 'ALL'>('ALL');
  const [now] = useState(() => Date.now());

  const filtered = MOCK_PROMOS.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search && !p.code.toLowerCase().includes(search.toLowerCase()) && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos codes promotionnels et offres spéciales</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FF8C00] text-white font-semibold rounded-lg hover:bg-[#E67E00] transition-colors text-sm">
          <Plus size={18} /> Nouvelle promotion
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code ou titre..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(['ALL', 'ACTIVE', 'SCHEDULED', 'EXPIRED', 'DISABLED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                statusFilter === s ? 'bg-[#FF8C00] text-white' : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              {s === 'ALL' ? 'Toutes' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Promotions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((promo) => {
          const cfg = STATUS_CONFIG[promo.status];
          const daysLeft = Math.max(0, Math.ceil((new Date(promo.endDate).getTime() - now) / 86400000));

          return (
            <div key={promo.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    {promo.discountType === 'PERCENTAGE'
                      ? <Percent size={18} className="text-[#FF8C00]" />
                      : <Tag size={18} className="text-[#FF8C00]" />
                    }
                  </div>
                  <div>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold', cfg.bg, cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit size={14} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 text-sm">{promo.title}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{promo.description}</p>

              <div className="mt-3 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-mono font-bold text-gray-900">{promo.code}</span>
                {promo.discountType === 'PERCENTAGE' && (
                  <span className="text-lg font-bold text-[#FF8C00]">-{promo.discountValue}%</span>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar size={12} />
                  <span>{formatDate(promo.startDate)} → {formatDate(promo.endDate)}</span>
                  {promo.status === 'ACTIVE' && daysLeft <= 7 && (
                    <span className="text-red-500 font-semibold">{daysLeft}j restants</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={12} />
                  <span>{promo.applicableProducts}</span>
                </div>
                {promo.minOrderAmount && (
                  <div className="flex items-center gap-2">
                    <span>Min : {formatCFA(promo.minOrderAmount)}</span>
                  </div>
                )}
              </div>

              {promo.maxUses && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Utilisation</span>
                    <span className="font-medium text-gray-700">{promo.currentUses}/{promo.maxUses}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full">
                    <div
                      className="h-1.5 bg-[#FF8C00] rounded-full transition-all"
                      style={{ width: `${Math.min(100, (promo.currentUses / promo.maxUses) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
