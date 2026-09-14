import { useQuery } from '@tanstack/react-query';
import { User, Phone, Mail, ShoppingBag, Loader2, UserX } from 'lucide-react';
import { customersApiService } from '@/features/customers/customers-api.service';
import type { Conversation } from './types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En fabrication',
  READY: 'Prête',
  SHIPPED: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

interface Props {
  conversation: Conversation;
}

export default function ClientInfoPanel({ conversation }: Props) {
  const userId = conversation.userId;

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', userId],
    queryFn: () => customersApiService.getCustomerDetail(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const displayName = conversation.user
    ? `${conversation.user.firstName} ${conversation.user.lastName}`
    : conversation.displayName || 'Inconnu';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* Identité */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-[#F37520]/10 flex items-center justify-center">
            <User size={20} className="text-[#F37520]" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">
              {conversation.user?.clientType === 'PROFESSIONNEL'
                ? 'Professionnel'
                : 'Particulier'}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} className="text-gray-400" />
            <span>{conversation.phone}</span>
          </div>
          {conversation.user?.email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={14} className="text-gray-400" />
              <span className="truncate">{conversation.user.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Client non lié */}
      {!userId && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <UserX size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Ce numéro WhatsApp n'est lié à aucun compte client BRIQUES.STORE.
          </p>
        </div>
      )}

      {/* Dernières commandes */}
      {userId && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
            <ShoppingBag size={13} />
            Dernières commandes
          </p>

          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#F37520]" />
            </div>
          )}

          {customer && customer.recentOrders.length === 0 && (
            <p className="text-xs text-gray-400">Aucune commande</p>
          )}

          <div className="space-y-2">
            {customer?.recentOrders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900">
                    {order.orderNumber}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="text-xs font-semibold text-[#F37520]">
                    {order.totalAmount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            ))}
          </div>

          {customer && (
            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
                <p className="text-[10px] text-gray-400 uppercase">Commandes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {(customer.totalRevenue / 1000).toFixed(0)}k
                </p>
                <p className="text-[10px] text-gray-400 uppercase">FCFA total</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
