import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Award, Calendar } from 'lucide-react';
import { formatCFA, formatDate } from '@/core/utils/formatters';
import { customersApiService, SalesAgentRank } from './customers-api.service';

/**
 * Classement des commerciaux — mêmes chiffres que GET /admin/sales-agents/ranking
 * (backend Lot 3 : filleuls vérifiés OTP + paiements CONFIRMED uniquement).
 */
export default function SalesAgentsPage() {
  const [ranking, setRanking] = useState<SalesAgentRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customersApiService.getSalesAgentsRanking({
        from: from || undefined,
        to: to || undefined,
      });
      setRanking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du classement');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const resetPeriod = () => {
    setFrom('');
    setTo('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/10 flex items-center justify-center">
            <Award size={20} className="text-[#FF8C00]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commerciaux</h1>
            <p className="text-sm text-gray-500">
              Classement par parrainages vérifiés et CA généré
            </p>
          </div>
        </div>
      </div>

      {/* Filtre période */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
            <Calendar size={12} /> Du
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1">
            <Calendar size={12} /> Au
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#FF8C00] outline-none"
          />
        </div>
        <button
          onClick={resetPeriod}
          className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Tout l'historique
        </button>
        <button
          onClick={fetchRanking}
          className="p-2 rounded-lg hover:bg-gray-100 ml-auto"
          title="Rafraîchir"
        >
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-[#FF8C00]" size={24} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Award size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            Aucun commercial actif. Activez le statut depuis une fiche client.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Commercial</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actif depuis</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Filleuls inscrits</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Filleuls clients</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CA généré</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((agent, index) => (
                <tr key={agent.agentId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-[#FF8C00] text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                    {agent.nom || agent.agentId.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {agent.salesAgentSince ? formatDate(agent.salesAgentSince) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-900">
                    {agent.inscrits}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-gray-900">
                    {agent.clients}
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900">
                    {formatCFA(agent.caTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
