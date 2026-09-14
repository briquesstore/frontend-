import { cn } from '@/lib/utils';
import type { Conversation } from './types';

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

interface Props {
  conversation: Conversation;
  selected: boolean;
  onClick: () => void;
}

export default function ConversationItem({ conversation, selected, onClick }: Props) {
  const name =
    conversation.user
      ? `${conversation.user.firstName} ${conversation.user.lastName}`
      : conversation.displayName || conversation.phone;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors',
        selected && 'bg-orange-50 border-l-4 border-l-[#F37520]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm text-gray-900 truncate">{name}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatRelativeTime(conversation.lastMessageAt)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="text-xs text-gray-500 truncate">
          {conversation.lastMessagePreview || '—'}
        </span>
        {conversation.unreadCount > 0 && (
          <span className="bg-[#F37520] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center flex-shrink-0">
            {conversation.unreadCount}
          </span>
        )}
      </div>
      {conversation.status === 'CLOSED' && (
        <span className="inline-block mt-1 text-[10px] uppercase tracking-wide text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          Fermée
        </span>
      )}
    </button>
  );
}
