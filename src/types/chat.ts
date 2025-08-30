//src/types/chat.ts
export interface SocketChatEvents {
  join_conversation: (data: { conversationId: number }) => void;
  send_message: (data: any) => void;
  typing_start: (data: { conversationId: number }) => void;
  typing_stop: (data: { conversationId: number }) => void;
}

export enum ChatConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked'
}

export enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system'
}

export enum ChatMessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed'
}