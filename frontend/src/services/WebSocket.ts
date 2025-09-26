//web socket
import { User } from "../types";
import {
  WsServerBroadcast,
  ClientMessageInterface,
  WsClientMessage,
  Direction,
} from "../types/websocket";

// Define the handler type - this should be a function that takes the payload
type MessageHandler<T extends keyof WsServerBroadcast> = (
  _payload: WsServerBroadcast[T],
) => void;

export class Websocket {
  private ws!: WebSocket | null;
  private messageHandlers: Map<string, MessageHandler<any>[]> = new Map();

  // web socket (init on profile load?)
  public initializeWebSocket(): void {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    //TODO is not stored there no more? is this esential??
    const token = localStorage.getItem("jwt");

    // Append token as query parameter if provided
    const urlWithToken = token
      ? `${wsUrl}?token=${encodeURIComponent(token)}`
      : wsUrl;

    // connect to ws with token
    console.log(urlWithToken);
    this.ws = new WebSocket(urlWithToken);

    this.ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      // TODO reconnection logic
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // web socket stuff
    this.ws.onopen = () => {
      console.log("opened web socket");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }

  private handleWebSocketMessage(data: any): void {
    console.log(data);
    const { event, payload } = data;
    const handlers = this.messageHandlers.get(event);
    if (handlers && handlers.length > 0) {
      handlers.forEach((handler) => handler(payload));
    } else {
      console.warn(`No handlers registered for event: ${event}`);
    }
  }

  // register a handler for a specific message type
  public onMessage<T extends keyof WsServerBroadcast>(
    event: T,
    handler: MessageHandler<T>,
  ): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  // remove a specific handler
  public offMessage<T extends keyof WsServerBroadcast>(
    event: T,
    handler: MessageHandler<T>,
  ): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // clear all handlers for an event
  public clearHandlers(event?: keyof WsServerBroadcast): void {
    if (event) {
      this.messageHandlers.delete(event);
    } else {
      this.messageHandlers.clear();
    }
  }

  // main send message function for ws
  private sendMessage<T extends keyof WsClientMessage>(
    message: ClientMessageInterface<T>,
  ): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log("SENT: ", message.payload);
    } else {
      console.warn("WebSocket is not open. Message not sent:", { message });
    }
  }

  // send message functions (pre defined)
  public messageGameStart(): void {
    const gameStartMessage: ClientMessageInterface<"game_start"> = {
      event: "game_start",
      payload: { gameId: import.meta.env.DEV_GAMEID },
    };
    this.sendMessage(gameStartMessage);
  }

  public async sendChatMessage(user: User, message: string) {
    console.log('WebSocket state:', this.ws?.readyState);
    const chatMessage: ClientMessageInterface<"chat_message"> = {
      event: "chat_message",
      payload: {
        recieverId: user.userId,
        message: message,
        timestamp: new Date().toString(),
      },
    };
    this.sendMessage(chatMessage);
  }

  public messageGameUpdateDirection(
    direction: Direction,
    sequence: number,
  ): void {
    const game_update: ClientMessageInterface<"game_update"> = {
      event: "game_update",
      payload: {
        direction: direction,
        sequence: sequence,
      },
    };
    this.sendMessage(game_update);
  }

  public messageGameResume(): void {
    const game_resume: ClientMessageInterface<"game_resume"> = {
      event: "game_resume",
      payload: { gameId: import.meta.env.DEV_GAMEID },
    };
    this.sendMessage(game_resume);
  }

  public messageGamePause(): void {
    const game_pause: ClientMessageInterface<"game_pause"> = {
      event: "game_pause",
      payload: { gameId: import.meta.env.DEV_GAMEID },
    };
    this.sendMessage(game_pause);
  }
}
