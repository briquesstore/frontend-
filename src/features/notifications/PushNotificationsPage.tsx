import { useState, useEffect } from 'react';
import { Send, Users, Megaphone, Bell, Database, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface Statistics {
  totalUsers: number;
  totalTokens: number;
  particulierUsers: number;
  professionnelUsers: number;
  particulierTokens: number;
  professionnelTokens: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  clientType: 'PARTICULIER' | 'PROFESSIONNEL';
  status: string;
}

// Types de notifications disponibles pour les transactionnelles
const NOTIFICATION_TYPES = [
  { value: 'ADMIN_MESSAGE', label: 'Message administrateur' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'INFO', label: 'Information générale' },
  { value: 'ALERT', label: 'Alerte importante' },
];

// Pages de redirection disponibles (deepLinks)
const DEEP_LINKS = [
  { value: '', label: 'Aucune redirection' },
  { value: '/home', label: 'Accueil' },
  { value: '/catalog', label: 'Catalogue produits' },
  { value: '/orders', label: 'Mes commandes' },
  { value: '/cart', label: 'Panier' },
  { value: '/profile', label: 'Profil' },
  { value: '/notifications', label: 'Centre de notifications' },
  { value: '/promotions', label: 'Promotions en cours' },
  { value: '/simulator', label: 'Simulateur / Estimateur' },
];

export default function PushNotificationsPage() {
  // Mode: 'broadcast' = push direct sans stockage, 'transactional' = stocké en base + push
  const [notificationMode, setNotificationMode] = useState<'broadcast' | 'transactional'>('broadcast');
  const [notificationType, setNotificationType] = useState('ADMIN_MESSAGE');
  const [targetType, setTargetType] = useState<'user' | 'users' | 'all' | 'segment'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [clientType, setClientType] = useState<'PARTICULIER' | 'PROFESSIONNEL'>('PARTICULIER');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await apiClient.get<Statistics>('/push-notifications/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (targetType === 'user' || targetType === 'users') {
      fetchUsers();
    }
  }, [targetType]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (targetType === 'user' || targetType === 'users') {
        fetchUsers();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [userSearch]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams({
        search: userSearch,
        pageSize: '50',
      });
      const response = await apiClient.get<{ data: User[] }>(`/users/list?${params}`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSend = async () => {
    if (!title || !body) {
      setResult({ success: false, message: 'Veuillez remplir le titre et le contenu' });
      return;
    }

    // Mode transactionnel nécessite un utilisateur spécifique
    if (notificationMode === 'transactional' && targetType !== 'user' && targetType !== 'users') {
      setResult({ success: false, message: 'Les notifications transactionnelles nécessitent de sélectionner un ou plusieurs utilisateurs' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let endpoint: string;
      let payload: any;

      // Préparer les data avec deepLink si défini
      const data = deepLink ? { deepLink } : undefined;

      if (notificationMode === 'transactional') {
        // Mode TRANSACTIONNEL : stocké en base + push
        endpoint = '/notifications/admin/create';
        payload = {
          title,
          body,
          type: notificationType,
          data,
        };

        if (targetType === 'user') {
          if (selectedUserIds.length === 0) {
            setResult({ success: false, message: 'Veuillez sélectionner un utilisateur' });
            setLoading(false);
            return;
          }
          payload.userId = selectedUserIds[0];
        } else if (targetType === 'users') {
          if (selectedUserIds.length === 0) {
            setResult({ success: false, message: 'Veuillez sélectionner au moins un utilisateur' });
            setLoading(false);
            return;
          }
          payload.userIds = selectedUserIds;
        }
      } else {
        // Mode BROADCAST : push direct sans stockage
        endpoint = '/push-notifications';
        payload = { title, body, data };

        switch (targetType) {
          case 'user':
            if (selectedUserIds.length === 0) {
              setResult({ success: false, message: 'Veuillez sélectionner au moins un utilisateur' });
              setLoading(false);
              return;
            }
            endpoint += '/send-to-user';
            payload.userId = selectedUserIds[0];
            break;
          case 'users':
            if (selectedUserIds.length === 0) {
              setResult({ success: false, message: 'Veuillez sélectionner au moins un utilisateur' });
              setLoading(false);
              return;
            }
            endpoint += '/send-to-users';
            payload.userIds = selectedUserIds;
            break;
          case 'segment':
            endpoint += '/send-to-segment';
            payload.clientType = clientType;
            break;
          case 'all':
            endpoint += '/send-to-all';
            break;
        }
      }

      const response = await apiClient.post<{ success: boolean; error?: string; count?: number }>(endpoint, payload);
      
      if (response.data.success) {
        const modeLabel = notificationMode === 'transactional' ? 'stockée et envoyée' : 'envoyée';
        const countInfo = response.data.count ? ` à ${response.data.count} utilisateur(s)` : '';
        setResult({ success: true, message: `Notification ${modeLabel} avec succès${countInfo}` });
        setTitle('');
        setBody('');
        setDeepLink('');
        setSelectedUserIds([]);
      } else {
        setResult({ success: false, message: response.data.error || 'Aucun token actif trouvé - les utilisateurs doivent ouvrir l\'app mobile' });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Erreur lors de l\'envoi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications Push</h1>
          <p className="text-sm text-gray-600 mt-1">Envoyer des notifications push aux utilisateurs</p>
        </div>
        <Bell className="h-6 w-6 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire d'envoi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Nouvelle notification
            </h2>

            <div className="space-y-4">
              {/* Mode de notification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de notification
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setNotificationMode('broadcast');
                      // Broadcast permet tous les types de cible
                    }}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                      notificationMode === 'broadcast'
                        ? 'border-[#FF8C00] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Zap className={cn('h-6 w-6', notificationMode === 'broadcast' ? 'text-[#FF8C00]' : 'text-gray-400')} />
                    <div className="text-left">
                      <p className={cn('font-medium', notificationMode === 'broadcast' ? 'text-[#FF8C00]' : 'text-gray-700')}>
                        Broadcast
                      </p>
                      <p className="text-xs text-gray-500">Push direct, non stocké</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setNotificationMode('transactional');
                      // Transactionnel nécessite un utilisateur spécifique
                      if (targetType === 'all' || targetType === 'segment') {
                        setTargetType('user');
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                      notificationMode === 'transactional'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Database className={cn('h-6 w-6', notificationMode === 'transactional' ? 'text-blue-500' : 'text-gray-400')} />
                    <div className="text-left">
                      <p className={cn('font-medium', notificationMode === 'transactional' ? 'text-blue-600' : 'text-gray-700')}>
                        Transactionnelle
                      </p>
                      <p className="text-xs text-gray-500">Stockée en base + push</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Type de notification (uniquement pour transactionnel) */}
              {notificationMode === 'transactional' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de notification
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type de cible */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de cible
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Tous - uniquement pour broadcast */}
                  <button
                    onClick={() => setTargetType('all')}
                    disabled={notificationMode === 'transactional'}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      targetType === 'all'
                        ? 'bg-[#FF8C00] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      notificationMode === 'transactional' && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Tous
                  </button>
                  {/* Segment - uniquement pour broadcast */}
                  <button
                    onClick={() => setTargetType('segment')}
                    disabled={notificationMode === 'transactional'}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      targetType === 'segment'
                        ? 'bg-[#FF8C00] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      notificationMode === 'transactional' && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Segment
                  </button>
                  <button
                    onClick={() => setTargetType('user')}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      targetType === 'user'
                        ? notificationMode === 'transactional' ? 'bg-blue-500 text-white' : 'bg-[#FF8C00] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Utilisateur
                  </button>
                  <button
                    onClick={() => setTargetType('users')}
                    className={cn(
                      'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                      targetType === 'users'
                        ? notificationMode === 'transactional' ? 'bg-blue-500 text-white' : 'bg-[#FF8C00] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    Multi-utilisateurs
                  </button>
                </div>
                {notificationMode === 'transactional' && (
                  <p className="text-xs text-blue-600 mt-2">
                    ℹ️ Les notifications transactionnelles nécessitent de sélectionner un ou plusieurs utilisateurs
                  </p>
                )}
              </div>

              {/* Sélection de segment */}
              {targetType === 'segment' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de client
                  </label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as 'PARTICULIER' | 'PROFESSIONNEL')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                  >
                    <option value="PARTICULIER">Particulier</option>
                    <option value="PROFESSIONNEL">Professionnel</option>
                  </select>
                </div>
              )}

              {/* Sélection d'utilisateurs */}
              {(targetType === 'user' || targetType === 'users') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {targetType === 'user' ? 'Sélectionner un utilisateur' : 'Sélectionner des utilisateurs'}
                  </label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Rechercher par nom, téléphone..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00] mb-3"
                  />
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    {loadingUsers ? (
                      <div className="p-4 text-center text-gray-500">Chargement...</div>
                    ) : users.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">Aucun utilisateur trouvé</div>
                    ) : (
                      users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50"
                        >
                          <input
                            type={targetType === 'user' ? 'radio' : 'checkbox'}
                            name="user"
                            checked={
                              targetType === 'user'
                                ? selectedUserIds[0] === user.id
                                : selectedUserIds.includes(user.id)
                            }
                            onChange={() => {
                              if (targetType === 'user') {
                                setSelectedUserIds([user.id]);
                              } else {
                                setSelectedUserIds((prev) =>
                                  prev.includes(user.id)
                                    ? prev.filter((id) => id !== user.id)
                                    : [...prev, user.id]
                                );
                              }
                            }}
                            className="h-4 w-4 text-[#FF8C00] focus:ring-[#FF8C00] border-gray-300"
                          />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{user.phone}</p>
                          </div>
                          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {user.clientType}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {targetType === 'users' && selectedUserIds.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedUserIds.length} utilisateur(s) sélectionné(s)
                    </p>
                  )}
                </div>
              )}

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titre de la notification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                />
              </div>

              {/* Contenu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Contenu de la notification"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                />
              </div>

              {/* Redirection (deepLink) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirection au clic (optionnel)
                </label>
                <select
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                >
                  {DEEP_LINKS.map((link) => (
                    <option key={link.value} value={link.value}>
                      {link.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Quand l'utilisateur clique sur la notification, il sera redirigé vers cette page
                </p>
              </div>

              {/* Bouton d'envoi */}
              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FF8C00] text-white rounded-md hover:bg-[#E67E00] transition-colors disabled:bg-gray-400"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Envoi...' : 'Envoyer la notification'}
              </button>

              {/* Résultat */}
              {result && (
                <div
                  className={cn(
                    'p-3 rounded-md',
                    result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  )}
                >
                  {result.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Statistiques
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total utilisateurs</span>
                <span className="font-semibold">{loadingStats ? '...' : statistics?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tokens actifs</span>
                <span className="font-semibold text-green-600">{loadingStats ? '...' : statistics?.totalTokens || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Particuliers</span>
                <span className="font-semibold">{loadingStats ? '...' : statistics?.particulierUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Professionnels</span>
                <span className="font-semibold">{loadingStats ? '...' : statistics?.professionnelUsers || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modes de notification</h3>
            <div className="text-sm text-gray-600 space-y-3">
              <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                <p className="font-medium text-orange-700 flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Broadcast
                </p>
                <p className="text-xs mt-1">Push direct sans stockage. Idéal pour les annonces générales, promos, infos marketing. L'utilisateur ne peut pas les retrouver dans son historique.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="font-medium text-blue-700 flex items-center gap-2">
                  <Database className="h-4 w-4" /> Transactionnelle
                </p>
                <p className="text-xs mt-1">Stockée en base + push. L'utilisateur peut la retrouver dans son centre de notifications. Idéal pour les messages importants personnalisés.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Types de cible</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• <strong>Tous</strong> : Tous les utilisateurs avec un token actif (broadcast uniquement)</p>
              <p>• <strong>Segment</strong> : Par type de client (broadcast uniquement)</p>
              <p>• <strong>Utilisateur</strong> : Un utilisateur spécifique</p>
              <p>• <strong>Multi-utilisateurs</strong> : Plusieurs utilisateurs sélectionnés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
