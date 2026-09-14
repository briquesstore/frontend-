import { apiClient } from '@/lib/api-client';
import type {
  Conversation,
  ConversationListResponse,
  Message,
  MessageListResponse,
  WhatsAppTemplate,
} from './types';

const BASE = '/admin/messaging';

export const messagingApi = {
  listConversations(params: { status?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return apiClient.get<ConversationListResponse>(
      `${BASE}/conversations?${qs.toString()}`,
    );
  },

  getConversation(id: string) {
    return apiClient.get<Conversation & { messages: Message[] }>(
      `${BASE}/conversations/${id}`,
    );
  },

  updateStatus(id: string, status: 'OPEN' | 'CLOSED') {
    return apiClient.patch<Conversation>(`${BASE}/conversations/${id}`, {
      status,
    });
  },

  markRead(id: string) {
    return apiClient.post<Conversation>(
      `${BASE}/conversations/${id}/mark-read`,
    );
  },

  getMessages(conversationId: string, params: { before?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params.before) qs.set('before', params.before);
    if (params.limit) qs.set('limit', String(params.limit));
    return apiClient.get<MessageListResponse>(
      `${BASE}/conversations/${conversationId}/messages?${qs.toString()}`,
    );
  },

  sendText(conversationId: string, content: string) {
    return apiClient.post<Message>(
      `${BASE}/conversations/${conversationId}/send-text`,
      { content },
    );
  },

  sendTemplate(
    conversationId: string,
    templateName: string,
    language: string,
    variables: string[],
  ) {
    return apiClient.post<Message>(
      `${BASE}/conversations/${conversationId}/send-template`,
      { templateName, language, variables },
    );
  },

  listTemplates() {
    return apiClient.get<WhatsAppTemplate[]>(`${BASE}/templates`);
  },
};
