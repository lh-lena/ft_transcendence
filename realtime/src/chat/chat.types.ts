import type { User } from '../schemas/user.schema.js';
import type { ChatMessagePayload } from '../schemas/chat.schema.js';

export interface ChatService {
  handleChatMessage(user: User, payload: ChatMessagePayload): Promise<void>;
}
