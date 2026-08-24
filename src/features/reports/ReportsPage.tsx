import { useState } from 'react';
import { Download, FileText, BarChart3, Package, Truck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatCFA } from '@/core/utils/formatters';

type Tab = 'commercial' | 'stock' | 'logistics';

// TODO: Fetch from API endpoints
const MONTHLY_REVENUE: any[] = [];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('commercial');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'commercial', label: 'Rapports commerciaux', icon: <BarChart3 size={16} /> },
    { key: 'stock', label: 'Rapports stocks', icon: <Package size={16} /> },
    { key: 'logistics', label: 'Rapports logistique', icon: <Truck size={16} /> },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
          <p className="text-sm text-gray-500 mt-1">Analyses détaillées de votre activité</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={16} /> Export Excel
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-[#FF8C00] text-[#FF8C00]'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Commercial */}
      {activeTab === 'commercial' && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Chiffre d'affaires mensuel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MONTHLY_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(v) => formatCFA(Number(v))} />
                <Bar dataKey="revenue" fill="#FF8C00" radius={[4, 4, 0, 0]} barSize={40} name="CA" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Product */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Ventes par produit</h3>
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>

            {/* Sales by Zone */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Répartition par zone</h3>
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          </div>
        </div>
      )}

      {/* Stock */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Rotation des stocks</h3>
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        </div>
      )}

      {/* Logistics */}
      {activeTab === 'logistics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Ponctualité des livraisons (%)</h3>
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        </div>
      )}
    </div>
  );
}
