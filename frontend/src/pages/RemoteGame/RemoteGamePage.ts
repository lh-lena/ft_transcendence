import { Router } from "../../router";
import { PongGame } from "../../game";
import { GameState, GameStatus } from "../../types";
import { ScoreBar } from "../../components/scoreBar";
import { generateProfilePrint } from "../../utils/generateProfilePrint";
import { Loading } from "../../components/loading";

import { Menu } from "../../components/menu";

// TODO-BACKEND switch out for backend data cached on merge
import { userStore } from "../../constants/backend";

//web socket
import {
  WsServerBroadcast,
  ClientMessageInterface,
  ServerMessageInterface,
  WsClientMessage,
} from "../../types/websocket";

import { websocketUrl } from "../../constants/websocket";

// test consts for websocket dev
const DEV_GAMEID = "test-game-1";

export class VsPlayerGamePage {
  private main: HTMLElement;
  private game: PongGame | null = null;
  private gameState: GameState;
  private scoreBar!: ScoreBar;
  private menu: Menu | null = null;
  private gameContainer: HTMLElement | null = null;
  private websocket: WebSocket | null = null;
  private loadingOverlay: Loading;
  private router: Router;

  constructor(router: Router) {
    this.router = router;
    // for player A
    const { color, colorMap } = generateProfilePrint();

    this.gameState = {
      status: GameStatus.PLAYING,
      playerA: { username: "left", score: 0, color: color, colorMap: colorMap },
      playerB: {
        username: userStore.username,
        score: 0,
        color: userStore.color,
        colorMap: userStore.colorMap,
      },
    };

    this.main = document.createElement("div");
    this.main.className =
      "sys-window flex flex-col gap-1 w-full min-h-full items-center justify-center bg-[#0400FF]";

    // grab data from backend
    // get web socket before countdown
    this.initializeWebSocket();

    this.loadingOverlay = new Loading("waiting for opponent");
    this.main.appendChild(this.loadingOverlay.getElement());

    // set up web socket and grab data
    this.initializeGame();
  }

  private initializeGame(): void {
    this.gameContainer = document.createElement("div");
    this.gameContainer.className = "flex items-center justify-center relative";

    // create game instance before score bar so we can pass game (need for pausing) into scorebar
    this.game = new PongGame(
      this.gameState,
      "remote",
      (scoreA, scoreB) => this.scoreBar.updateScores(scoreA, scoreB),
      () => this.checkPauseStatus(),
    );

    this.scoreBar = new ScoreBar(this.gameState);
    this.scoreBar.mount(this.main);

    this.main.appendChild(this.gameContainer);
    this.game.mount(this.gameContainer);
  }

  private showPauseOverlay(): void {
    this.game?.hideGamePieces();
    if (this.gameContainer && !this.menu) {
      // Create and mount menu to game container instead of main element
      const menuItems = [{ name: "quit", link: "/profile" }];
      this.menu = new Menu(this.router, menuItems);
      this.menu.mount(this.gameContainer);
      // Add overlay styling to menu element
      const menuElement = this.menu.menuElement;
      menuElement.style.position = "absolute";
      menuElement.style.top = "50%";
      menuElement.style.left = "50%";
      menuElement.style.transform = "translate(-50%, -50%)";
      menuElement.style.zIndex = "1000";
    }
  }

  private hidePauseOverlay(): void {
    this.game?.showGamePieces();
    // Unmount menu before removing overlay
    if (this.menu) {
      this.menu.unmount();
      this.menu = null;
    }
  }

  private checkPauseStatus(): void {
    if (this.gameState.status === GameStatus.PAUSED) {
      this.showPauseOverlay();
      // send pause to websocket
    } else {
      this.hidePauseOverlay();
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }

  // web socket
  private initializeWebSocket(): void {
    const wsUrl = websocketUrl;

    this.websocket = new WebSocket(wsUrl);

    const gameStartMessage: ClientMessageInterface<"game_start"> = {
      event: "game_start",
      payload: { gameId: DEV_GAMEID },
    };

    this.websocket.onopen = () => {
      console.log("WebSocket connected");
      // Send initial connection message
      this.sendMessage(gameStartMessage);
    };

    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.websocket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      // Optionally implement reconnection logic here
    };

    this.websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private sendMessage<T extends keyof WsClientMessage>(
    message: ClientMessageInterface<T>,
  ): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open. Message not sent:", { message });
    }
  }

  private countdownHook(message: string): void {
    console.log("trying to change text");
    this.loadingOverlay.changeText(message);
  }

  private startGameHook(): void {
    this.loadingOverlay.hide();
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage<T extends keyof WsServerBroadcast>(
    data: ServerMessageInterface<T>,
  ): void {
    // Implement your logic here to handle different message types
    console.log("Received WebSocket message:", data);
    // Example: update game state, scores, etc. based on data
    // if (data.error) this.toggleErrorScreen(data.error.message)
    switch (data.event) {
      case "countdown_update": {
        const countdownData =
          data as ServerMessageInterface<"countdown_update">;
        this.countdownHook(countdownData.payload.message);
        break;
      }
      case "notification": {
        const notificationData = data as ServerMessageInterface<"notification">;
        if (notificationData.payload.message == "Game started!")
          this.startGameHook();
        break;
      }
      case "game_update":
        this.game?.updateGameStateFromServer(data);
    }
  }
}
