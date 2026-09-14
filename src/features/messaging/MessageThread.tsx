import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, ChevronUp, Clock } from 'lucide-react';
import { messagingApi } from './messaging.api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import type { Conversation, Message } from './types';

interface Props {
  conversation: Conversation;
}

export default function MessageThread({ conversation }: Props) {
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Reset l'historique chargé quand on change de conversation
  useEffect(() => {
    setOlderMessages([]);
    setNextCursor(null);
  }, [conversation.id]);

  // Marquer comme lue à l'ouverture
  useEffect(() => {
    if (conversation.unreadCount > 0) {
      messagingApi.markRead(conversation.id).then(() => {
        queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      });
    }
  }, [conversation.id, conversation.unreadCount, queryClient]);

  // Détail conversation = user + 20 derniers messages (polling 10s)
  const { data, isLoading } = useQuery({
    queryKey: ['messaging', 'conversation', conversation.id],
    queryFn: async () => {
      const res = await messagingApi.getConversation(conversation.id);
      return res.data;
    },
    refetchInterval: 10_000,
  });

  const recentMessages = data?.messages ?? [];
  const messages = [...olderMessages, ...recentMessages];

  // Scroll en bas à l'arrivée de nouveaux messages récents
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [recentMessages.length, conversation.id]);

  const loadMore = async () => {
    const cursor = nextCursor ?? messages[0]?.id;
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await messagingApi.getMessages(conversation.id, {
        before: cursor,
        limit: 50,
      });
      setOlderMessages((prev) => [...res.data.data, ...prev]);
      setNextCursor(res.data.meta.hasMore ? res.data.meta.nextCursor : null);
    } finally {
      setLoadingMore(false);
    }
  };

  const windowOpen =
    conversation.windowExpiresAt &&
    new Date(conversation.windowExpiresAt).getTime() > Date.now();

  const windowEnd = conversation.windowExpiresAt
    ? new Date(conversation.windowExpiresAt).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header conversation */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div>
          <p className="font-medium text-sm text-gray-900">
            {conversation.user
              ? `${conversation.user.firstName} ${conversation.user.lastName}`
              : conversation.displayName || conversation.phone}
          </p>
          <p className="text-xs text-gray-500">{conversation.phone}</p>
        </div>
        <span
          className={
            conversation.status === 'OPEN'
              ? 'text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full'
              : 'text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full'
          }
        >
          {conversation.status === 'OPEN' ? 'Ouverte' : 'Fermée'}
        </span>
      </div>

      {/* Bandeau fenêtre 24h */}
      <div
        className={
          windowOpen
            ? 'px-4 py-2 text-xs text-center bg-green-50 text-green-700 border-b border-green-100'
            : 'px-4 py-2 text-xs text-center bg-amber-50 text-amber-700 border-b border-amber-100'
        }
      >
        {windowOpen ? (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> Fenêtre 24h ouverte jusqu'à {windowEnd} — réponses libres possibles
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> Fenêtre 24h fermée — seuls les templates peuvent être envoyés
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {(nextCursor !== null || messages.length >= 20) && (
          <div className="flex justify-center mb-3">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm hover:text-[#F37520] disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <ChevronUp size={12} />
              )}
              Charger les messages précédents
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#F37520]" />
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie (texte libre ou template selon fenêtre 24h) */}
      <MessageInput
        conversation={conversation}
        onSent={() => {
          queryClient.invalidateQueries({
            queryKey: ['messaging', 'conversation', conversation.id],
          });
          queryClient.invalidateQueries({
            queryKey: ['messaging', 'conversations'],
          });
        }}
      />
    </div>
  );
}
