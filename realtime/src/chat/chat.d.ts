export interface ChatService {
  handleChatMessage(user: User, payload: ChatMessagePayload): Promise<void>;
}
