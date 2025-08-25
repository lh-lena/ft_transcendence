export interface ChatService {
  handleChatMessage(user: User, payload: ChatMessagePayload): void;
}
