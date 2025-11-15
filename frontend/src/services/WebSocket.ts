//web socket
import { showInfo } from "../components/toast";
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

export type wsGameStatus = "playing" | "not_playing";

export class Websocket {
  private ws!: WebSocket | null;
  private messageHandlers: Map<string, MessageHandler<any>[]> = new Map();
  private gameStatus!: wsGameStatus;
  private cleanupHandler?: () => void;

  // Reconnection state
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimeout?: number;
  private isIntentionallyClosed = false;

  // web socket (init on profile load?)
  public async initializeWebSocket(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket connection already in progress");
      return;
    }

    // Don't reconnect if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    const token = localStorage.getItem("jwt");

    this.gameStatus = "not_playing";
    this.isIntentionallyClosed = false;

    // Append token as query parameter if provided
    const urlWithToken = token
      ? `${wsUrl}?token=${encodeURIComponent(token)}`
      : wsUrl;

    try {
      this.ws = new WebSocket(urlWithToken);

      this.ws.onopen = () => {
        console.log("WebSocket connected successfully");
        this.reconnectAttempts = 0; // Reset on successful connection
        this.reconnectDelay = 1000;
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);

        // Don't reconnect if intentionally closed or auth failed (4401)
        if (this.isIntentionallyClosed || event.code === 4401) {
          console.log("Connection closed intentionally or auth failed");
          return;
        }

        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        // onclose will handle reconnection
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
          if (data.event === "notification") {
            // custom for guest leaving
            if (data.payload.message === "unknown left the game")
              showInfo("guest left the tournament");
            else showInfo(data.payload.message);
          }
          if (data.event !== "game_update") {
            console.log(`${data.event}: `, data.payload.message);
            console.log(`${JSON.stringify(data.payload)}`);
          }
          // console.log("RECEIVED FROM WS: ", data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      // define behavior when user closes window
      this.cleanupHandler = this.handleWindowClose.bind(this);
      window.addEventListener("beforeunload", this.cleanupHandler);
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      showInfo("Unable to connect to server. Please refresh the page.");
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.initializeWebSocket();
    }, delay);
  }

  private handleWindowClose() {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.cleanupHandler) {
      window.removeEventListener("beforeunload", this.cleanupHandler);
    }
    this.ws?.close(1000, "Client closing");
    this.ws = null;
  }

  private handleWebSocketMessage(data: any): void {
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
  private async sendMessage<T extends keyof WsClientMessage>(
    message: ClientMessageInterface<T>,
  ) {
    // Wait for connection if it's in CONNECTING state
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      await this.waitForConnection();
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log("SENT: ", message.payload);
    } else {
      console.warn("WebSocket not ready. Message not sent:", { message });
      throw new Error("WebSocket not connected");
    }
  }

  private waitForConnection(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = 100;
      let elapsed = 0;

      const interval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          clearInterval(interval);
          resolve();
        } else if (elapsed >= timeout) {
          clearInterval(interval);
          reject(new Error("Connection timeout"));
        }
        elapsed += checkInterval;
      }, checkInterval);
    });
  }

  public setGameStatusPlaying() {
    this.gameStatus = "playing";
  }

  public setGameStatusNotPlaying() {
    this.gameStatus = "not_playing";
  }

  public getGameStatus(): wsGameStatus {
    return this.gameStatus;
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public isConnecting(): boolean {
    return this.ws?.readyState === WebSocket.CONNECTING;
  }

  public async ensureConnection(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      await this.waitForConnection();
      return;
    }

    await this.initializeWebSocket();
    await this.waitForConnection();
  }

  // send message functions (pre defined)
  public messageGameStart(gameID: string): void {
    const gameStartMessage: ClientMessageInterface<"game_start"> = {
      event: "game_start",
      payload: { gameId: gameID },
    };
    this.sendMessage(gameStartMessage);
  }

  public messageClientReady(gameID: string): void {
    const clientReadyMessage: ClientMessageInterface<"client_ready"> = {
      event: "client_ready",
      payload: { gameId: gameID, timestamp: Date.now() },
    };
    this.sendMessage(clientReadyMessage);
  }

  public async sendChatMessage(user: User, message: string) {
    console.log("WebSocket state:", this.ws?.readyState);
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
    gameId: string,
  ): void {
    const game_update: ClientMessageInterface<"game_update"> = {
      event: "game_update",
      payload: {
        gameId: gameId,
        direction: direction,
        sequence: sequence,
      },
    };
    this.sendMessage(game_update);
  }

  public messageGameResume(gameId: string): void {
    const game_resume: ClientMessageInterface<"game_resume"> = {
      event: "game_resume",
      payload: { gameId: gameId },
    };
    this.sendMessage(game_resume);
  }

  public messageGameLeave(gameId: string): void {
    const game_leave: ClientMessageInterface<"game_leave"> = {
      event: "game_leave",
      payload: { gameId: gameId },
    };
    this.sendMessage(game_leave);
    console.log("sent game leave");
  }

  public messageGamePause(gameId: string): void {
    console.log("sending game pause");
    const game_pause: ClientMessageInterface<"game_pause"> = {
      event: "game_pause",
      payload: { gameId: gameId },
    };
    this.sendMessage(game_pause);
  }

  public close(): void {
    this.isIntentionallyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close(1000, "Client closing");
    this.ws = null;
  }
}
