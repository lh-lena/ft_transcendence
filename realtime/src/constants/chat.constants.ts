export const CHAT_EVENTS = {
  MESSAGE: 'chat_message',
} as const;

export type ChatEventType = (typeof CHAT_EVENTS)[keyof typeof CHAT_EVENTS];
