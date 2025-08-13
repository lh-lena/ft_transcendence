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
  private menuPauseDiv: HTMLDivElement | null = null;
  private gameContainer: HTMLElement | null = null;
  private websocket: WebSocket | null = null;
  private loadingOverlay: Loading;
  private router: Router;
  private pauseCountdown!: HTMLElement;

  constructor(router: Router) {
    this.router = router;
    // for player A
    const { color, colorMap } = generateProfilePrint();

    this.gameState = {
      status: GameStatus.PLAYING,
      previousStatus: GameStatus.PLAYING,
      playerA: { username: "left", score: 0, color: color, colorMap: colorMap },
      playerB: {
        username: userStore.username,
        score: 0,
        color: userStore.color,
        colorMap: userStore.colorMap,
      },
      blockedPlayButton: false,
    };

    this.main = document.createElement("div");
    this.main.className =
      "sys-window flex flex-col gap-1 w-full min-h-full items-center justify-center bg-[#0400FF]";

    // grab data from backend
    // get web socket before countdown
    this.loadingOverlay = new Loading("connecting to server");
    this.initializeWebSocket();

    this.loadingOverlay.changeText("waiting for opponent");
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
      () => this.gameStateCallback(),
      "remote",
    );

    this.scoreBar = new ScoreBar(this.gameState, () =>
      this.gameStateCallback(),
    );
    this.scoreBar.mount(this.main);

    this.main.appendChild(this.gameContainer);
    this.game.mount(this.gameContainer);
  }

  private showPauseOverlay(): void {
    this.game?.hideGamePieces();
    if (this.gameContainer && !this.menuPauseDiv) {
      this.menuPauseDiv = document.createElement("div");
      this.menuPauseDiv.className = "flex flex-col gap-5";
      // Create and mount menu to game container instead of main element
      const menuItems = [{ name: "quit", link: "/profile" }];
      const menuPause = new Menu(this.router, menuItems);
      this.pauseCountdown = document.createElement("h1");
      this.pauseCountdown.innerText = "paused";
      this.pauseCountdown.className = "text-white text text-center";
      this.menuPauseDiv.appendChild(this.pauseCountdown);
      menuPause.mount(this.menuPauseDiv);
      this.gameContainer.appendChild(this.menuPauseDiv);
      // Add overlay styling to menu element
      this.menuPauseDiv.style.position = "absolute";
      this.menuPauseDiv.style.top = "50%";
      this.menuPauseDiv.style.left = "50%";
      this.menuPauseDiv.style.transform = "translate(-50%, -50%)";
      this.menuPauseDiv.style.zIndex = "1000";
    }
  }

  private hidePauseOverlay(): void {
    this.game?.showGamePieces();
    // Unmount menu before removing overlay
    if (this.menuPauseDiv) {
      this.gameContainer?.removeChild(this.menuPauseDiv);
      this.menuPauseDiv = null;
    }
  }

  private gameStateCallback(): void {
    // update score bar on hook
    if (this.scoreBar) {
      this.scoreBar.updateScores(
        this.gameState.playerA.score,
        this.gameState.playerB.score,
      );
    }

    // pause play stuff
    // playing
    if (
      this.gameState.status == GameStatus.PLAYING &&
      this.gameState.previousStatus == GameStatus.PAUSED
    ) {
      this.scoreBar.pausePlay.toggleIsPlaying(true);
      this.game?.showGamePieces();
      this.hidePauseOverlay();
      this.gameState.previousStatus = GameStatus.PLAYING;
      // send game resume to ws
      const game_resume: ClientMessageInterface<"game_resume"> = {
        event: "game_resume",
        payload: { gameId: DEV_GAMEID },
      };
      this.sendMessage(game_resume);
      // paused
    } else if (
      this.gameState.status == GameStatus.PAUSED &&
      this.gameState.previousStatus == GameStatus.PLAYING
    ) {
      this.scoreBar.pausePlay.toggleIsPlaying(false);
      this.game?.hideGamePieces();
      this.showPauseOverlay();
      // send game pause to ws
      this.gameState.previousStatus = GameStatus.PAUSED;
      const game_pause: ClientMessageInterface<"game_pause"> = {
        event: "game_pause",
        payload: { gameId: DEV_GAMEID },
      };
      this.sendMessage(game_pause);
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
    if (this.gameState.status == GameStatus.PAUSED) {
      this.pauseCountdown.innerText = "game resumes in: " + message;
      if (message == "GO!") this.pauseCountdown.innerText = message;
    } else this.loadingOverlay.changeText(message);
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
          this.loadingOverlay.hide();
        // in the case game is starting again after pause
        break;
      }
      case "game_update": {
        const gameUpdateData = data as ServerMessageInterface<"game_update">;
        this.game?.updateGameStateFromServer(gameUpdateData);
        break;
      }
      case "game_pause": {
        this.gameState.status = GameStatus.PAUSED;
        this.gameState.blockedPlayButton = true;
        this.gameStateCallback();
        break;
      }
      case "game_resume": {
        this.gameState.status = GameStatus.PLAYING;
        this.gameState.blockedPlayButton = false;
        this.gameStateCallback();
        break;
      }
    }
  }

  // private updateOnPlayerInput(): void {
  //   const game_update: ClientMessageInterface<"game_update"> = {
  //     event: "game_update",
  //     payload: { gameId: DEV_GAMEID },
  //   };
  // }
}
