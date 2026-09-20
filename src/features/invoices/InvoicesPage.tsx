import { useState, useEffect } from 'react';
import { Search, Download, FileText, Eye, Printer, CheckCircle, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCFA, formatDate } from '@/core/utils/formatters';
import { invoicesApiService, Invoice } from './invoices-api.service';

type DisplayStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

const STATUS_CONFIG: Record<DisplayStatus, { label: string; color: string; bg: string }> = {
  PAID: { label: 'Payée', color: 'text-green-700', bg: 'bg-green-50' },
  PENDING: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  OVERDUE: { label: 'En retard', color: 'text-red-700', bg: 'bg-red-50' },
  CANCELLED: { label: 'Annulée', color: 'text-gray-500', bg: 'bg-gray-100' },
};

function getDisplayStatus(invoice: Invoice): DisplayStatus {
  if (invoice.status === 'CANCELLED') return 'CANCELLED';
  if (invoice.balanceDue === 0) return 'PAID';
  if (invoice.dueDate && new Date(invoice.dueDate) < new Date()) return 'OVERDUE';
  return 'PENDING';
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | 'ALL'>('ALL');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoicesApiService.getAllInvoices({ limit: 100 });
      setInvoices(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const displayStatus = getDisplayStatus(inv);
    if (statusFilter !== 'ALL' && displayStatus !== statusFilter) return false;
    if (search && !inv.number.toLowerCase().includes(search.toLowerCase()) && !inv.customerName.toLowerCase().includes(search.toLowerCase()) && !(inv.orderNumber || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPaid = invoices.filter((i) => getDisplayStatus(i) === 'PAID').reduce((s, i) => s + i.totalTTC, 0);
  const totalOverdue = invoices.filter((i) => getDisplayStatus(i) === 'OVERDUE').reduce((s, i) => s + i.totalTTC, 0);

  const handleDownload = async (invoice: Invoice) => {
    try {
      await invoicesApiService.downloadInvoice(invoice.id, invoice.number);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
    }
  };

  const handleView = async (invoice: Invoice) => {
    try {
      const url = await invoicesApiService.viewInvoice(invoice.id);
      window.open(url, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ouverture de la facture');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion et génération des factures conformes DGI</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download size={16} /> Exporter tout
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total facturé (payé)</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCFA(totalPaid)}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Factures acquittées
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Factures générées</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Émises ce mois
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <FileText size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Impayés en retard</span>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCFA(totalOverdue)}</p>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-red-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                Relance client requise
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* DGI compliance badge */}
      <div className="flex items-center gap-2.5 p-3.5 bg-gradient-to-r from-emerald-50 to-green-50/60 border border-emerald-200/70 rounded-xl mb-5 text-xs text-emerald-900 shadow-2xs">
        <ShieldCheck size={18} className="text-emerald-600 flex-shrink-0" />
        <span className="font-medium">Factures conformes à la réglementation DGI : TVA 18% · Numérotation chronologique continue · Archivage sécurisé 10 ans</span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-[#FF8C00]" size={24} />
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N° facture, client, commande..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none" />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {(['ALL', 'PAID', 'PENDING', 'OVERDUE', 'CANCELLED'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', statusFilter === s ? 'bg-[#FF8C00] text-white' : 'text-gray-600 hover:bg-gray-100')}>
                  {s === 'ALL' ? 'Toutes' : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">N° Facture</th>
              <th className="text-left px-4 py-3">Commande</th>
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-right px-4 py-3">HT</th>
              <th className="text-right px-4 py-3">TVA 18%</th>
              <th className="text-right px-4 py-3">TTC</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((inv) => {
              const displayStatus = getDisplayStatus(inv);
              const cfg = STATUS_CONFIG[displayStatus];
              return (
                <tr key={inv.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{inv.number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{inv.orderNumber || inv.preorderNumber || '-'}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-gray-900">{inv.customerName}</span>
                      <span className={cn('ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium', inv.customerType === 'PROFESSIONNEL' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500')}>
                        {inv.customerType === 'PROFESSIONNEL' ? 'PRO' : 'PART'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCFA(inv.amountHT)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatCFA(inv.tva)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCFA(inv.totalTTC)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', cfg.bg, cfg.color)}>{cfg.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(inv.issuedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleView(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Voir"><Eye size={14} /></button>
                      <button onClick={() => handleDownload(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="PDF"><Download size={14} /></button>
                      <button onClick={() => handleView(inv)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Imprimer"><Printer size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}
