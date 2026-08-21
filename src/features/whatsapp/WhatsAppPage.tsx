import { useState, useEffect } from 'react';
import { Send, MessageCircle, Phone, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  clientType: 'PARTICULIER' | 'PROFESSIONNEL';
  status: string;
}

// Statuts de commande pour les notifications
const ORDER_STATUSES = [
  { value: 'CONFIRMED', label: 'Commande confirmée', emoji: '✅' },
  { value: 'PROCESSING', label: 'En cours de fabrication', emoji: '🏭' },
  { value: 'READY', label: 'Prête pour livraison', emoji: '📦' },
  { value: 'SHIPPED', label: 'En cours de livraison', emoji: '🚚' },
  { value: 'DELIVERED', label: 'Livrée', emoji: '🎉' },
  { value: 'CANCELLED', label: 'Annulée', emoji: '❌' },
];

export default function WhatsAppPage() {
  const [messageType, setMessageType] = useState<'text' | 'order'>('text');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [orderStatus, setOrderStatus] = useState('CONFIRMED');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserList, setShowUserList] = useState(false);

  // Recherche d'utilisateurs avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearch.length >= 2) {
        fetchUsers();
      } else {
        setUsers([]);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [userSearch]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams({
        search: userSearch,
        pageSize: '20',
      });
      const response = await apiClient.get<{ data: User[] }>(`/users/list?${params}`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const selectUser = (user: User) => {
    setSelectedUser(user);
    setPhone(user.phone);
    setCustomerName(`${user.firstName} ${user.lastName}`);
    setShowUserList(false);
    setUserSearch('');
  };

  const handleSendText = async () => {
    if (!phone || !message) {
      setResult({ success: false, message: 'Veuillez remplir le numéro et le message' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/admin/whatsapp/send-text',
        { phone, message }
      );
      
      if (response.data.success) {
        setResult({ success: true, message: 'Message WhatsApp envoyé avec succès !' });
        setMessage('');
      } else {
        setResult({ success: false, message: response.data.message || 'Échec de l\'envoi' });
      }
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'envoi' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOrderNotification = async () => {
    if (!phone || !orderRef || !customerName) {
      setResult({ success: false, message: 'Veuillez remplir tous les champs' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/admin/whatsapp/send-order-notification',
        { phone, orderRef, status: orderStatus, customerName }
      );
      
      if (response.data.success) {
        setResult({ success: true, message: 'Notification de commande envoyée avec succès !' });
        setOrderRef('');
      } else {
        setResult({ success: false, message: response.data.message || 'Échec de l\'envoi' });
      }
    } catch (error: any) {
      setResult({ 
        success: false, 
        message: error.response?.data?.message || error.message || 'Erreur lors de l\'envoi' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (messageType === 'text') {
      handleSendText();
    } else {
      handleSendOrderNotification();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
          <p className="text-sm text-gray-600 mt-1">Envoyer des messages WhatsApp aux clients</p>
        </div>
        <MessageCircle className="h-6 w-6 text-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire d'envoi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              Nouveau message WhatsApp
            </h2>

            <div className="space-y-4">
              {/* Type de message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de message
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMessageType('text')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                      messageType === 'text'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <MessageCircle className={cn('h-6 w-6', messageType === 'text' ? 'text-green-500' : 'text-gray-400')} />
                    <div className="text-left">
                      <p className={cn('font-medium', messageType === 'text' ? 'text-green-600' : 'text-gray-700')}>
                        Message libre
                      </p>
                      <p className="text-xs text-gray-500">Texte personnalisé</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setMessageType('order')}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                      messageType === 'order'
                        ? 'border-[#FF8C00] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Phone className={cn('h-6 w-6', messageType === 'order' ? 'text-[#FF8C00]' : 'text-gray-400')} />
                    <div className="text-left">
                      <p className={cn('font-medium', messageType === 'order' ? 'text-[#FF8C00]' : 'text-gray-700')}>
                        Notification commande
                      </p>
                      <p className="text-xs text-gray-500">Statut de commande</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recherche client */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher un client (optionnel)
                </label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserList(true);
                  }}
                  onFocus={() => setShowUserList(true)}
                  placeholder="Rechercher par nom, téléphone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                
                {/* Liste des utilisateurs */}
                {showUserList && (userSearch.length >= 2 || users.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="p-4 text-center text-gray-500">Chargement...</div>
                    ) : users.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {userSearch.length < 2 ? 'Tapez au moins 2 caractères' : 'Aucun utilisateur trouvé'}
                      </div>
                    ) : (
                      users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="w-full flex items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 text-left"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{user.phone}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                            {user.clientType}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Client sélectionné */}
              {selectedUser && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </p>
                    <p className="text-xs text-green-600">{selectedUser.phone}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setPhone('');
                      setCustomerName('');
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Numéro de téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex: 22507XXXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format international avec indicatif pays (225 pour Côte d'Ivoire)
                </p>
              </div>

              {/* Champs spécifiques selon le type */}
              {messageType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre message..."
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length} caractères
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du client
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Jean Dupont"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Référence commande
                    </label>
                    <input
                      type="text"
                      value={orderRef}
                      onChange={(e) => setOrderRef(e.target.value)}
                      placeholder="Ex: CMD-2026-001234"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut de la commande
                    </label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.emoji} {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Bouton d'envoi */}
              <button
                onClick={handleSend}
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors disabled:bg-gray-400',
                  messageType === 'text'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-[#FF8C00] text-white hover:bg-[#E67E00]'
                )}
              >
                <Send className="h-4 w-4" />
                {loading ? 'Envoi en cours...' : 'Envoyer via WhatsApp'}
              </button>

              {/* Résultat */}
              {result && (
                <div
                  className={cn(
                    'flex items-center gap-2 p-4 rounded-md',
                    result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  )}
                >
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                  {result.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              WhatsApp Business
            </h3>
            <div className="text-sm text-gray-600 space-y-3">
              <div className="p-3 bg-green-50 rounded-md border border-green-200">
                <p className="font-medium text-green-700">Message libre</p>
                <p className="text-xs mt-1">
                  Envoyez un message personnalisé à un client. Idéal pour le support client ou les communications individuelles.
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-md border border-orange-200">
                <p className="font-medium text-[#FF8C00]">Notification commande</p>
                <p className="text-xs mt-1">
                  Informez automatiquement le client du statut de sa commande avec un message formaté.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Format du numéro</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Le numéro doit être au format international :</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>225</strong> + numéro (Côte d'Ivoire)</li>
                <li>Ex: <code className="bg-gray-100 px-1 rounded">22507XXXXXXXX</code></li>
                <li>Sans espaces ni tirets</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statuts disponibles</h3>
            <div className="space-y-2">
              {ORDER_STATUSES.map((status) => (
                <div key={status.value} className="flex items-center gap-2 text-sm">
                  <span>{status.emoji}</span>
                  <span className="text-gray-600">{status.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
