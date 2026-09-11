import { useEffect, useState, useCallback } from 'react';
import { Download, Loader2, Mail, Plus, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  source: string;
  createdAt: string;
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get<WaitlistEntry[]>('/admin/waitlist');
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la liste d\'attente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    try {
      setAdding(true);
      setError(null);
      await apiClient.post('/admin/waitlist', {
        email,
        name: newName.trim() || undefined,
        phone: newPhone.trim() || undefined,
        source: 'backoffice',
      });
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      fetchEntries();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout.');
    } finally {
      setAdding(false);
    }
  };

  const exportCsv = () => {
    const header = 'Email,Nom,Telephone,Source,Date\n';
    const rows = entries
      .map((e) => `${e.email},${e.name || ''},${e.phone || ''},${e.source},${new Date(e.createdAt).toISOString()}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liste d&apos;attente</h1>
          <p className="text-gray-500 mt-1">
            {entries.length} inscription{entries.length > 1 ? 's' : ''} à ce jour.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEntries}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={exportCsv}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#FF8C00] hover:bg-[#e67e00] disabled:opacity-60"
          >
            <Download size={16} />
            Exporter CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="mb-8 p-5 bg-white border border-gray-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
      >
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF8C00]"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@exemple.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF8C00]"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="07 XX XX XX XX"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF8C00]"
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#FF8C00] hover:bg-[#e67e00] disabled:opacity-60"
        >
          <Plus size={16} />
          {adding ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Nom</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Téléphone</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Source</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Date d&apos;inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Chargement...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Mail className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    Aucune inscription pour le moment.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{entry.email}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.source}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
