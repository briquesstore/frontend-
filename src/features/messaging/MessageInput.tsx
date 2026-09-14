import { useState } from 'react';
import { Send, Loader2, FileText } from 'lucide-react';
import { messagingApi } from './messaging.api';
import TemplatePicker from './TemplatePicker';
import type { Conversation } from './types';

interface Props {
  conversation: Conversation;
  onSent: () => void;
}

export default function MessageInput({ conversation, onSent }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const windowOpen =
    !!conversation.windowExpiresAt &&
    new Date(conversation.windowExpiresAt).getTime() > Date.now();

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      await messagingApi.sendText(conversation.id, content);
      setText('');
      onSent();
    } catch (e: any) {
      setError(e?.message ?? "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Fenêtre fermée → seuls les templates sont autorisés
  if (!windowOpen) {
    return (
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <button
          onClick={() => setShowTemplates(true)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F37520] text-white text-sm font-medium rounded-lg hover:bg-[#d9641a] transition-colors"
        >
          <FileText size={16} />
          Envoyer un template (fenêtre 24h fermée)
        </button>
        {showTemplates && (
          <TemplatePicker
            conversation={conversation}
            onClose={() => setShowTemplates(false)}
            onSent={onSent}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          rows={1}
          className="flex-1 resize-none px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37520]/40 focus:border-[#F37520] max-h-32"
        />
        <button
          onClick={() => setShowTemplates(true)}
          title="Envoyer un template"
          className="p-2.5 rounded-lg text-gray-500 hover:text-[#F37520] hover:bg-orange-50 transition-colors"
        >
          <FileText size={18} />
        </button>
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-lg bg-[#F37520] text-white hover:bg-[#d9641a] disabled:opacity-40 transition-colors"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      {showTemplates && (
        <TemplatePicker
          conversation={conversation}
          onClose={() => setShowTemplates(false)}
          onSent={onSent}
        />
      )}
    </div>
  );
}
