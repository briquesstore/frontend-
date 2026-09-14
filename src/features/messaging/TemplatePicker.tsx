import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, FileText, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { messagingApi } from './messaging.api';
import type { Conversation, WhatsAppTemplate } from './types';

interface Props {
  conversation: Conversation;
  onClose: () => void;
  onSent: () => void;
}

/** Compte les variables {{n}} dans le body d'un template. */
function countVariables(template: WhatsAppTemplate): number {
  const body = template.components?.find((c) => c.type === 'BODY');
  if (!body?.text) return 0;
  const matches = body.text.match(/\{\{\d+\}\}/g);
  return matches ? new Set(matches).size : 0;
}

function bodyText(template: WhatsAppTemplate): string {
  return template.components?.find((c) => c.type === 'BODY')?.text ?? '';
}

export default function TemplatePicker({ conversation, onClose, onSent }: Props) {
  const [selected, setSelected] = useState<WhatsAppTemplate | null>(null);
  const [variables, setVariables] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['messaging', 'templates'],
    queryFn: async () => (await messagingApi.listTemplates()).data,
    staleTime: 5 * 60 * 1000,
  });

  const grouped = (templates ?? []).reduce<Record<string, WhatsAppTemplate[]>>(
    (acc, t) => {
      (acc[t.category] ??= []).push(t);
      return acc;
    },
    {},
  );

  const selectTemplate = (t: WhatsAppTemplate) => {
    setSelected(t);
    setError(null);
    const count = countVariables(t);
    // Préremplit {{1}} avec le prénom du client (convention courante)
    const firstName = conversation.user?.firstName ?? '';
    setVariables(Array.from({ length: count }, (_, i) => (i === 0 ? firstName : '')));
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    setError(null);
    try {
      await messagingApi.sendTemplate(
        conversation.id,
        selected.name,
        selected.language,
        variables,
      );
      onSent();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Échec de l'envoi du template");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-[#F37520]" />
            Choisir un template WhatsApp
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Liste des templates */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#F37520]" />
            </div>
          )}

          {!isLoading && (templates ?? []).length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">
              Aucun template approuvé trouvé sur le compte WhatsApp Business.
            </p>
          )}

          {Object.entries(grouped).map(([category, list]) => (
            <div key={category} className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {category}
              </p>
              <div className="space-y-2">
                {list.map((t) => (
                  <button
                    key={`${t.name}-${t.language}`}
                    onClick={() => selectTemplate(t)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      selected?.name === t.name && selected?.language === t.language
                        ? 'border-[#F37520] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900">{t.name}</span>
                      <span className="text-xs text-gray-400">{t.language}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {bodyText(t)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Variables + envoi */}
        {selected && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            {variables.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Variables du template</p>
                {variables.map((v, i) => (
                  <input
                    key={i}
                    value={v}
                    onChange={(e) =>
                      setVariables((prev) =>
                        prev.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                    placeholder={`{{${i + 1}}}`}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F37520]/40 focus:border-[#F37520]"
                  />
                ))}
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSend}
              disabled={sending || variables.some((v) => !v.trim())}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F37520] text-white text-sm font-medium rounded-lg hover:bg-[#d9641a] disabled:opacity-50 transition-colors"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Envoyer le template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
