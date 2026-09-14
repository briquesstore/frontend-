export interface ConversationUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  clientType?: string;
}

export interface Conversation {
  id: string;
  userId: string | null;
  user: ConversationUser | null;
  phone: string;
  displayName: string | null;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  windowExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSender {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: 'INCOMING' | 'OUTGOING';
  senderType: 'CLIENT' | 'ADMIN';
  senderId: string | null;
  sender: MessageSender | null;
  content: string;
  messageType: 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT' | string;
  wamid: string | null;
  templateName: string | null;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ConversationListResponse {
  data: Conversation[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface MessageListResponse {
  data: Message[];
  meta: { hasMore: boolean; nextCursor: string | null };
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION' | string;
  status: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
  }>;
}
