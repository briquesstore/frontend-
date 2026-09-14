import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import ClientInfoPanel from './ClientInfoPanel';
import type { Conversation } from './types';

export default function MessagingPage() {
  const [selected, setSelected] = useState<Conversation | null>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Colonne 1 : liste des conversations */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200">
        <ConversationList
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
      </div>

      {/* Colonne 2 : fil de messages */}
      <div className="flex-1 flex flex-col bg-[#ECE5DD]">
        {selected ? (
          <MessageThread conversation={selected} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Messagerie WhatsApp</p>
            <p className="text-sm mt-1">
              Sélectionnez une conversation pour afficher les messages
            </p>
          </div>
        )}
      </div>

      {/* Colonne 3 : infos client */}
      <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white">
        {selected && <ClientInfoPanel conversation={selected} />}
      </div>
    </div>
  );
}
