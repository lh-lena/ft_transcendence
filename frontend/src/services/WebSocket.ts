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

  // web socket (init on profile load?)
  public async initializeWebSocket() {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    //TODO is not stored there no more? is this esential??
    const token = localStorage.getItem("jwt");

    this.gameStatus = "not_playing";

    // Append token as query parameter if provided
    const urlWithToken = token
      ? `${wsUrl}?token=${encodeURIComponent(token)}`
      : wsUrl;

    // connect to ws with token
    // console.log(urlWithToken);
    this.ws = new WebSocket(urlWithToken);

    this.ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      // TODO reconnection logic
    };

    // very very simple reconnection logic
    this.ws.onerror = (error) => {
      console.error("WebSocket error:", JSON.stringify(error));
      //showError(JSON.stringify(error));
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      // i think this reconnection BS was causing lots of error
      // we should try this within app -> if we cant connect we try a couple times
      // setTimeout(() => {
      //   this.initializeWebSocket();
      // }, 1000);
    };

    // web socket stuff
    this.ws.onopen = () => {
      console.log("opened web socket");
      // this.onConnectionReady?.();
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
  }

  private handleWindowClose() {
    if (this.cleanupHandler) {
      window.removeEventListener("beforeunload", this.cleanupHandler);
    }
    this.ws?.close();
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log("SENT: ", message.payload);
    } else {
      console.warn("WebSocket is not open. Message not sent:", { message });
      // try again i guess
      await this.initializeWebSocket();
      await this.sendMessage(message);
    }
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
    this.ws?.close();
  }
}
