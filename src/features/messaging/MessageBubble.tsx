import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from './types';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusTicks({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'PENDING':
      return <Clock size={14} className="text-gray-400" />;
    case 'SENT':
      return <Check size={14} className="text-gray-400" />;
    case 'DELIVERED':
      return <CheckCheck size={14} className="text-gray-400" />;
    case 'READ':
      return <CheckCheck size={14} className="text-blue-500" />;
    case 'FAILED':
      return <AlertCircle size={14} className="text-red-500" />;
    default:
      return null;
  }
}

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isOutgoing = message.direction === 'OUTGOING';

  return (
    <div
      className={cn(
        'flex mb-2 px-4',
        isOutgoing ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-3 py-2 shadow-sm',
          isOutgoing
            ? 'bg-[#F37520] text-white rounded-br-none'
            : 'bg-white text-gray-900 rounded-bl-none',
        )}
      >
        {/* Nom de l'agent pour les messages sortants */}
        {isOutgoing && message.sender && (
          <p className="text-[10px] font-medium opacity-75 mb-0.5">
            {message.sender.firstName} {message.sender.lastName}
          </p>
        )}

        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {message.messageType === 'TEMPLATE' && message.templateName && (
          <p
            className={cn(
              'text-[10px] mt-1 italic',
              isOutgoing ? 'text-white/70' : 'text-gray-400',
            )}
          >
            Template : {message.templateName}
          </p>
        )}

        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            isOutgoing ? 'text-white/70' : 'text-gray-400',
          )}
        >
          <span className="text-[10px]">{formatTime(message.createdAt)}</span>
          {isOutgoing && <StatusTicks status={message.status} />}
        </div>

        {message.status === 'FAILED' && message.errorMessage && (
          <p className="text-[10px] text-red-200 mt-1">{message.errorMessage}</p>
        )}
      </div>
    </div>
  );
}
