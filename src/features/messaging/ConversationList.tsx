import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { messagingApi } from './messaging.api';
import ConversationItem from './ConversationItem';
import type { Conversation } from './types';

type StatusFilter = 'ALL' | 'OPEN' | 'CLOSED';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'OPEN', label: 'Ouvertes' },
  { key: 'CLOSED', label: 'Fermées' },
];

interface Props {
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export default function ConversationList({ selectedId, onSelect }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['messaging', 'conversations', filter, page],
    queryFn: async () => {
      const res = await messagingApi.listConversations({
        status: filter === 'ALL' ? undefined : filter,
        page,
        limit: 20,
      });
      return res.data;
    },
    // Polling toutes les 10s pour rafraîchir la liste (pas de WebSocket en MVP)
    refetchInterval: 10_000,
  });

  const conversations = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Filtres */}
      <div className="flex gap-1 p-3 border-b border-gray-200">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
              filter === f.key
                ? 'bg-[#F37520] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#F37520]" />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-red-500 py-8">
            Erreur de chargement des conversations
          </p>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MessageSquare className="w-10 h-10 mb-2" />
            <p className="text-sm">Aucune conversation</p>
          </div>
        )}

        {conversations.map((c) => (
          <ConversationItem
            key={c.id}
            conversation={c}
            selected={c.id === selectedId}
            onClick={() => onSelect(c)}
          />
        ))}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="disabled:opacity-40 hover:text-[#F37520]"
          >
            ← Précédent
          </button>
          <span>
            {page} / {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="disabled:opacity-40 hover:text-[#F37520]"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
