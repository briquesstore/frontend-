import { useState, useEffect } from 'react';
import {
  Users, CreditCard, Truck, FileText, Bell, ClipboardList,
  Shield, Plus, Edit, ToggleLeft, ToggleRight, Lock, Save, CheckCircle, AlertTriangle, Building2, Phone, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/core/utils/formatters';
import { ROLE_LABELS } from '@/core/types';
import { usersApi, type BackofficeUser } from '@/core/api/users.api';
import { auditApi, type AuditLog } from '@/core/api/audit.api';
import { issuerProfileApi, type IssuerProfile, type CreateIssuerProfileDto } from '@/core/api/issuer-profile.api';
import { settingsApi } from '@/core/api/settings.api';

type Tab = 'users' | 'payments' | 'delivery' | 'invoicing' | 'notifications' | 'preorders' | 'audit';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'users', label: 'Utilisateurs', icon: <Users size={16} /> },
  { key: 'payments', label: 'Paiements', icon: <CreditCard size={16} /> },
  { key: 'delivery', label: 'Livraison', icon: <Truck size={16} /> },
  { key: 'invoicing', label: 'Facturation', icon: <FileText size={16} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { key: 'preorders', label: 'Pré-commandes', icon: <ClipboardList size={16} /> },
  { key: 'audit', label: 'Audit', icon: <Shield size={16} /> },
];

function SettingCard({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle, disabled }: { enabled: boolean; onToggle?: () => void; disabled?: boolean }) {
  const icon = enabled
    ? <ToggleRight size={28} className={disabled ? 'text-orange-300' : 'text-[#FF8C00]'} />
    : <ToggleLeft size={28} className={disabled ? 'text-gray-200' : 'text-gray-300'} />;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled || !onToggle}
      className={cn('transition-opacity', onToggle ? 'cursor-pointer hover:opacity-80' : 'cursor-default', disabled && 'opacity-50 cursor-wait')}
      aria-pressed={enabled}
    >
      {icon}
    </button>
  );
}

const PAYMENT_METHODS: { key: string; label: string; description: string }[] = [
  { key: 'pm.orange_money', label: 'Orange Money', description: 'Via FeexPay' },
  { key: 'pm.mtn_money', label: 'MTN Money', description: 'Via FeexPay' },
  { key: 'pm.moov_money', label: 'Moov Money', description: 'Via FeexPay' },
  { key: 'pm.wave', label: 'Wave', description: 'Via FeexPay / Wave Business' },
  { key: 'pm.card', label: 'Carte bancaire (Visa/Mastercard)', description: 'Via FeexPay' },
];

const JURIDICAL_FORMS = ['SARL', 'SA', 'SAS', 'SNC', 'EURL', 'GIE', 'Association'];
const FISCAL_REGIMES = ['Réel Normal', 'Réel Simplifié', 'Forfait', 'Synthétique'];

interface IssuerFormData {
  raisonSociale: string;
  formeJuridique: string;
  capitalSocial: string;
  siegeSocial: string;
  rccm: string;
  ncc: string;
  idu: string;
  regimeFiscal: string;
  telephone: string;
  email: string;
  logoUrl: string;
}

const initialIssuerForm: IssuerFormData = {
  raisonSociale: '',
  formeJuridique: '',
  capitalSocial: '',
  siegeSocial: '',
  rccm: '',
  ncc: '',
  idu: '',
  regimeFiscal: '',
  telephone: '',
  email: '',
  logoUrl: '',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<BackofficeUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour le profil émetteur
  const [issuerProfile, setIssuerProfile] = useState<IssuerProfile | null>(null);
  const [issuerForm, setIssuerForm] = useState<IssuerFormData>(initialIssuerForm);
  const [issuerLoading, setIssuerLoading] = useState(false);
  const [issuerSaving, setIssuerSaving] = useState(false);
  const [issuerSuccess, setIssuerSuccess] = useState(false);
  const [issuerError, setIssuerError] = useState<string | null>(null);

  // Moyens de paiement : defauts identiques a l'app mobile si aucune clef en base
  const [paymentMethods, setPaymentMethods] = useState<Record<string, boolean>>({
    'pm.orange_money': true,
    'pm.mtn_money': true,
    'pm.moov_money': true,
    'pm.wave': true,
    'pm.card': false,
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSavingKey, setPaymentSavingKey] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await usersApi.getAll();
        setUsers(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des utilisateurs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Charger les logs d'audit
  useEffect(() => {
    const loadAuditLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await auditApi.getAll({ limit: 50 });
        setAuditLogs(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des logs d\'audit');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  // Charger le profil émetteur
  useEffect(() => {
    const loadIssuerProfile = async () => {
      setIssuerLoading(true);
      setIssuerError(null);
      try {
        const response = await issuerProfileApi.getActive();
        const profile = response.data;
        setIssuerProfile(profile);
        setIssuerForm({
          raisonSociale: profile.raisonSociale || '',
          formeJuridique: profile.formeJuridique || '',
          capitalSocial: profile.capitalSocial?.toString() || '',
          siegeSocial: profile.siegeSocial || '',
          rccm: profile.rccm || '',
          ncc: profile.ncc || '',
          idu: profile.idu || '',
          regimeFiscal: profile.regimeFiscal || '',
          telephone: profile.telephone || '',
          email: profile.email || '',
          logoUrl: profile.logoUrl || '',
        });
      } catch (err) {
        console.error('Erreur chargement profil émetteur:', err);
        // Si pas de profil, on garde les valeurs par défaut
      } finally {
        setIssuerLoading(false);
      }
    };

    if (activeTab === 'invoicing') {
      loadIssuerProfile();
    }
  }, [activeTab]);

  // Charger les moyens de paiement quand l'onglet s'ouvre
  useEffect(() => {
    if (activeTab !== 'payments') return;
    const load = async () => {
      setPaymentLoading(true);
      setPaymentError(null);
      try {
        const configs = await settingsApi.getByGroup('payments');
        setPaymentMethods((prev) => {
          const next = { ...prev };
          for (const c of configs) {
            if (c.key in next) next[c.key] = c.value === 'true';
          }
          return next;
        });
      } catch (err) {
        console.error('Erreur chargement moyens de paiement:', err);
        setPaymentError('Impossible de charger la configuration. Valeurs par défaut affichées.');
      } finally {
        setPaymentLoading(false);
      }
    };
    load();
  }, [activeTab]);

  const handleTogglePayment = async (key: string, label: string) => {
    const next = !paymentMethods[key];
    setPaymentMethods((prev) => ({ ...prev, [key]: next }));
    setPaymentSavingKey(key);
    setPaymentError(null);
    try {
      await settingsApi.update(key, String(next), label);
    } catch (err) {
      console.error('Erreur sauvegarde moyen de paiement:', err);
      setPaymentMethods((prev) => ({ ...prev, [key]: !next }));
      setPaymentError(`Échec de la mise à jour de ${label}.`);
    } finally {
      setPaymentSavingKey(null);
    }
  };

  // Sauvegarder le profil émetteur
  const handleSaveIssuerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuerSaving(true);
    setIssuerSuccess(false);
    setIssuerError(null);

    try {
      const dto: CreateIssuerProfileDto = {
        raisonSociale: issuerForm.raisonSociale,
        formeJuridique: issuerForm.formeJuridique,
        capitalSocial: parseInt(issuerForm.capitalSocial, 10) || 0,
        siegeSocial: issuerForm.siegeSocial,
        rccm: issuerForm.rccm,
        ncc: issuerForm.ncc,
        idu: issuerForm.idu,
        regimeFiscal: issuerForm.regimeFiscal,
        telephone: issuerForm.telephone,
        email: issuerForm.email,
        logoUrl: issuerForm.logoUrl || undefined,
      };

      const response = await issuerProfileApi.update(dto);
      setIssuerProfile(response.data);
      setIssuerSuccess(true);
      setTimeout(() => setIssuerSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde profil émetteur:', err);
      setIssuerError('Erreur lors de la sauvegarde du profil émetteur');
    } finally {
      setIssuerSaving(false);
    }
  };

  const formatCFA = (amount: string) => {
    const num = parseInt(amount, 10);
    return isNaN(num) ? '0 FCFA' : new Intl.NumberFormat('fr-FR').format(num) + ' FCFA';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres système</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration globale de la plateforme</p>
      </div>

      <div className="flex gap-6">
        {/* Left Nav */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  activeTab === tab.key
                    ? 'bg-[#FF8C00] text-white'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Users Management */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-900">Gestion des utilisateurs</h2>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF8C00] text-white text-sm font-medium rounded-lg hover:bg-[#E67E00]">
                  <Plus size={16} /> Nouveau compte
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dernière connexion</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && activeTab === 'users' ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Chargement...
                        </td>
                      </tr>
                    ) : error && activeTab === 'users' ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                          {error}
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                          Aucun utilisateur
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FF8C00] flex items-center justify-center text-white text-xs font-bold">
                                {u.firstName[0]}{u.lastName[0]}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold',
                              u.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                            )}>
                              {u.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {u.updatedAt ? formatDateTime(u.updatedAt) : 'Jamais'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Modifier">
                                <Edit size={16} />
                              </button>
                              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Reset password">
                                <Lock size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Config */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Moyens de paiement</h2>
              <p className="text-xs text-gray-500 mb-5">
                Moyens de paiement proposés dans l'application mobile à l'écran de paiement.
              </p>
              {paymentError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
                  <span className="text-red-700">{paymentError}</span>
                </div>
              )}
              {paymentLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">Chargement...</div>
              ) : (
                PAYMENT_METHODS.map((m) => (
                  <SettingCard key={m.key} label={m.label} description={m.description}>
                    <ToggleSwitch
                      enabled={paymentMethods[m.key]}
                      disabled={paymentSavingKey === m.key}
                      onToggle={() => handleTogglePayment(m.key, m.label)}
                    />
                  </SettingCard>
                ))
              )}
            </div>
          )}

          {/* Delivery Config */}
          {activeTab === 'delivery' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Configuration de la livraison</h2>
              <SettingCard label="Seuil livraison gratuite" description="Montant minimum pour la livraison gratuite">
                <span className="text-sm font-semibold text-gray-900">5 000 000 FCFA</span>
              </SettingCard>
              <SettingCard label="Délai standard (Abidjan)" description="Nombre de jours ouvrés">
                <span className="text-sm font-semibold text-gray-900">3-5 jours</span>
              </SettingCard>
              <SettingCard label="Délai express (Abidjan)" description="Nombre de jours ouvrés">
                <span className="text-sm font-semibold text-gray-900">1-2 jours</span>
              </SettingCard>
              <SettingCard label="Livraison express activée">
                <ToggleSwitch enabled={true} />
              </SettingCard>
              <SettingCard label="Retrait en entrepôt activé">
                <ToggleSwitch enabled={true} />
              </SettingCard>
            </div>
          )}

          {/* Invoicing Config */}
          {activeTab === 'invoicing' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Profil Émetteur</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Informations légales de l'entreprise (DGI Côte d'Ivoire)</p>
                </div>
                {issuerProfile && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Version {issuerProfile.version}
                  </span>
                )}
              </div>

              {/* DGI compliance badge */}
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg mb-6 text-xs">
                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                <span className="text-green-700 font-medium">
                  Profil émetteur conforme aux exigences DGI — RCCM, NCC, IDU obligatoires — Versionning automatique
                </span>
              </div>

              {/* Success message */}
              {issuerSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-6 text-sm">
                  <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                  <span className="text-green-700 font-medium">Profil mis à jour avec succès !</span>
                </div>
              )}

              {/* Error message */}
              {issuerError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6 text-sm">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
                  <span className="text-red-700 font-medium">{issuerError}</span>
                </div>
              )}

              {issuerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : (
                <form onSubmit={handleSaveIssuerProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Raison sociale */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Raison sociale <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={issuerForm.raisonSociale}
                          onChange={(e) => setIssuerForm({ ...issuerForm, raisonSociale: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                          placeholder="Ex: AXIMO BTP"
                          required
                        />
                      </div>
                    </div>

                    {/* Forme juridique */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Forme juridique <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={issuerForm.formeJuridique}
                        onChange={(e) => setIssuerForm({ ...issuerForm, formeJuridique: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        {JURIDICAL_FORMS.map((form) => (
                          <option key={form} value={form}>{form}</option>
                        ))}
                      </select>
                    </div>

                    {/* Capital social */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capital social (FCFA) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={issuerForm.capitalSocial}
                        onChange={(e) => setIssuerForm({ ...issuerForm, capitalSocial: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                        placeholder="Ex: 10000000"
                        required
                      />
                      {issuerForm.capitalSocial && (
                        <p className="text-xs text-gray-500 mt-1">{formatCFA(issuerForm.capitalSocial)}</p>
                      )}
                    </div>

                    {/* Siège social */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Siège social <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={issuerForm.siegeSocial}
                        onChange={(e) => setIssuerForm({ ...issuerForm, siegeSocial: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none resize-none"
                        rows={2}
                        placeholder="Ex: Abidjan, Côte d'Ivoire"
                        required
                      />
                    </div>

                    {/* RCCM */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RCCM <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={issuerForm.rccm}
                        onChange={(e) => setIssuerForm({ ...issuerForm, rccm: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none uppercase"
                        placeholder="Ex: CI-ABJ-2024-B-12345"
                        required
                      />
                    </div>

                    {/* NCC */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NCC <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={issuerForm.ncc}
                        onChange={(e) => setIssuerForm({ ...issuerForm, ncc: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none uppercase"
                        placeholder="Ex: 1234567A"
                        required
                      />
                    </div>

                    {/* IDU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IDU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={issuerForm.idu}
                        onChange={(e) => setIssuerForm({ ...issuerForm, idu: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none uppercase"
                        placeholder="Ex: CI-2024-0001234"
                        required
                      />
                    </div>

                    {/* Régime fiscal */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Régime fiscal <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={issuerForm.regimeFiscal}
                        onChange={(e) => setIssuerForm({ ...issuerForm, regimeFiscal: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        {FISCAL_REGIMES.map((regime) => (
                          <option key={regime} value={regime}>{regime}</option>
                        ))}
                      </select>
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={issuerForm.telephone}
                          onChange={(e) => setIssuerForm({ ...issuerForm, telephone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                          placeholder="Ex: +225 07 00 00 00 00"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={issuerForm.email}
                          onChange={(e) => setIssuerForm({ ...issuerForm, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                          placeholder="Ex: contact@aximo-btp.ci"
                          required
                        />
                      </div>
                    </div>

                    {/* Logo URL */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL du logo (optionnel)
                      </label>
                      <input
                        type="url"
                        value={issuerForm.logoUrl}
                        onChange={(e) => setIssuerForm({ ...issuerForm, logoUrl: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-6 text-xs">
                    <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-yellow-700">
                      <strong>Important :</strong> Chaque modification crée une nouvelle version du profil. Les factures existantes conservent leur version d'origine.
                    </span>
                  </div>

                  {/* Fixed settings */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Paramètres fixes (DGI)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Taux TVA</p>
                        <p className="text-sm font-semibold text-gray-900">18%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Préfixe factures</p>
                        <p className="text-sm font-semibold text-gray-900">FACT-{new Date().getFullYear()}-</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Durée d'archivage</p>
                        <p className="text-sm font-semibold text-gray-900">10 ans</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Hash de sécurité</p>
                        <p className="text-sm font-semibold text-gray-900">SHA-256</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (issuerProfile) {
                          setIssuerForm({
                            raisonSociale: issuerProfile.raisonSociale || '',
                            formeJuridique: issuerProfile.formeJuridique || '',
                            capitalSocial: issuerProfile.capitalSocial?.toString() || '',
                            siegeSocial: issuerProfile.siegeSocial || '',
                            rccm: issuerProfile.rccm || '',
                            ncc: issuerProfile.ncc || '',
                            idu: issuerProfile.idu || '',
                            regimeFiscal: issuerProfile.regimeFiscal || '',
                            telephone: issuerProfile.telephone || '',
                            email: issuerProfile.email || '',
                            logoUrl: issuerProfile.logoUrl || '',
                          });
                        }
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={issuerSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FF8C00] text-white rounded-lg text-sm font-medium hover:bg-[#e67e00] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      {issuerSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Notifications Config */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Configuration des notifications</h2>
              <SettingCard label="SMS (confirmation commande)" description="Template avec variables {nom}, {numero_commande}">
                <ToggleSwitch enabled={true} />
              </SettingCard>
              <SettingCard label="WhatsApp (suivi livraison)" description="Via API WhatsApp Business">
                <ToggleSwitch enabled={true} />
              </SettingCard>
              <SettingCard label="Email (facture)" description="Envoi automatique de la facture PDF">
                <ToggleSwitch enabled={true} />
              </SettingCard>
              <SettingCard label="SMS (rappel pré-commande)" description="Envoyé 3 jours avant l'échéance">
                <ToggleSwitch enabled={true} />
              </SettingCard>
              <SettingCard label="Push notifications (back-office)" description="Alertes en temps réel via WebSocket">
                <ToggleSwitch enabled={true} />
              </SettingCard>
            </div>
          )}

          {/* Preorders Config */}
          {activeTab === 'preorders' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Configuration des pré-commandes</h2>
              <SettingCard label="Acompte minimum" description="Pourcentage obligatoire à la souscription">
                <span className="text-sm font-semibold text-gray-900">15%</span>
              </SettingCard>
              <SettingCard label="Durée maximale" description="Durée max du prix bloqué">
                <span className="text-sm font-semibold text-gray-900">12 mois</span>
              </SettingCard>
              <SettingCard label="Pénalité de retard" description="Appliquée sur montants en retard">
                <span className="text-sm font-semibold text-gray-900">5%</span>
              </SettingCard>
              <SettingCard label="Échéances impayées avant suspension" description="Nombre d'échéances consécutives">
                <span className="text-sm font-semibold text-gray-900">2</span>
              </SettingCard>
              <SettingCard label="Délai de grâce" description="Jours après échéance avant pénalité">
                <span className="text-sm font-semibold text-gray-900">7 jours</span>
              </SettingCard>
            </div>
          )}

          {/* Audit Logs */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Journaux d'audit</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Détails</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && activeTab === 'audit' ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Chargement...
                        </td>
                      </tr>
                    ) : error && activeTab === 'audit' ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                          {error}
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Aucun log d'audit
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(log.createdAt)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{log.action}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
