import { Router } from "../../router";
import { PongGame } from "../../game";
import { GameState, GameStatus } from "../../types";
import { ScoreBar } from "../../components/scoreBar";
import { Loading } from "../../components/loading";
import { Menu } from "../../components/menu";

// TODO-BACKEND switch out for backend data cached on merge
import { userStore, userStore2 } from "../../constants/backend";

//web socket
import {
  WsServerBroadcast,
  ClientMessageInterface,
  ServerMessageInterface,
  WsClientMessage,
  Direction,
} from "../../types/websocket";

import { websocketUrl } from "../../constants/websocket";
import { ProfileAvatar } from "../../components/profileAvatar";

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
  private menuEndDiv!: HTMLDivElement;
  private endResultText!: HTMLElement;
  // private spectatorBar!: SpectatorBar;

  constructor(router: Router) {
    this.router = router;
    this.gameState = {
      status: GameStatus.PLAYING,
      previousStatus: GameStatus.PLAYING,
      // by default we always pull logged in player (local client) into player A at beg
      playerA: {
        ...userStore,
        score: 0,
      },
      playerB: {
        ...userStore2,
        score: 0,
      },
      pauseInitiatedByMe: false,
      blockedPlayButton: false,
      activeKey: "",
      previousKey: "",
      activePaddle: undefined,
      wsPaddleSequence: 0,
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
    // spectator bar
    // this.spectatorBar = new SpectatorBar();
    // this.spectatorBar.mount(this.main);
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

    const currentKey = this.gameState.activeKey;
    if (currentKey != this.gameState.previousKey) {
      // key event handling
      if (currentKey == "KEY_UP") {
        const game_update: ClientMessageInterface<"game_update"> = {
          event: "game_update",
          payload: {
            direction: Direction.UP,
            sequence: this.gameState.wsPaddleSequence,
          },
        };
        this.sendMessage(game_update);
      } else if (currentKey == "KEY_DOWN") {
        const game_update: ClientMessageInterface<"game_update"> = {
          event: "game_update",
          payload: {
            direction: Direction.DOWN,
            sequence: this.gameState.wsPaddleSequence,
          },
        };
        this.sendMessage(game_update);
      } else if (currentKey == "") {
        const game_update: ClientMessageInterface<"game_update"> = {
          event: "game_update",
          payload: {
            direction: Direction.STOP,
            sequence: this.gameState.wsPaddleSequence,
          },
        };
        this.sendMessage(game_update);
      }
      this.gameState.previousKey = currentKey;
    }

    // pause play stuff
    // playing
    if (
      this.gameState.status == GameStatus.PLAYING &&
      this.gameState.previousStatus == GameStatus.PAUSED
    ) {
      // this.gameState.blockedPlayButton = false;
      this.scoreBar.pausePlay.toggleIsPlaying(true);
      this.gameState.previousStatus = GameStatus.PLAYING;
      if (this.gameState.pauseInitiatedByMe == true) {
        const game_resume: ClientMessageInterface<"game_resume"> = {
          event: "game_resume",
          payload: { gameId: DEV_GAMEID },
        };
        this.sendMessage(game_resume);
      }
      // paused
    } else if (
      this.gameState.status == GameStatus.PAUSED &&
      this.gameState.previousStatus == GameStatus.PLAYING
    ) {
      // this.gameState.blockedPlayButton = true;
      this.scoreBar.pausePlay.toggleIsPlaying(false);
      this.game?.hideGamePieces();
      this.showPauseOverlay();
      // send game pause to ws -> only from client who actually paused the button (otherwise we get duplicate send)
      this.gameState.previousStatus = GameStatus.PAUSED;
      if (this.gameState.pauseInitiatedByMe == true) {
        const game_pause: ClientMessageInterface<"game_pause"> = {
          event: "game_pause",
          payload: { gameId: DEV_GAMEID },
        };
        this.sendMessage(game_pause);
      } else {
        this.gameState.blockedPlayButton = true;
      }
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
      console.log("SENT: ", message.payload);
    } else {
      console.warn("WebSocket is not open. Message not sent:", { message });
    }
  }

  private countdownHook(message: string): void {
    if (
      this.gameState.status == GameStatus.PAUSED ||
      (this.gameState.status == GameStatus.PLAYING &&
        this.gameState.pauseInitiatedByMe == true)
    ) {
      this.pauseCountdown.innerText = "game resumes in: " + message;
      if (message == "GO!") this.pauseCountdown.innerText = message;
    } else this.loadingOverlay.changeText(message);
  }

  private showEndGameOverlay(): void {
    this.game?.hideGamePieces();
    if (this.gameContainer && !this.menuPauseDiv) {
      this.menuEndDiv = document.createElement("div");
      this.menuEndDiv.className = "flex flex-col gap-5 items-center";
      // Create and mount menu to game container instead of main element
      const menuItems = [{ name: "quit", link: "/profile" }];
      const menuEnd = new Menu(this.router, menuItems);
      // make a private class member in order to change with result of match
      let avatar = new ProfileAvatar(
        this.gameState.playerA.color,
        this.gameState.playerA.colorMap,
      );
      this.menuEndDiv.appendChild(avatar.getElement());
      this.endResultText = document.createElement("h1");
      this.endResultText.textContent = "XXX wins";
      this.endResultText.className = "text-white text text-center";
      this.menuEndDiv.appendChild(this.endResultText);
      menuEnd.mount(this.menuEndDiv);
      this.gameContainer.appendChild(this.menuEndDiv);
      // Add overlay styling to menu element
      this.menuEndDiv.style.position = "absolute";
      this.menuEndDiv.style.top = "50%";
      this.menuEndDiv.style.left = "50%";
      this.menuEndDiv.style.transform = "translate(-50%, -50%)";
      this.menuEndDiv.style.zIndex = "1000";
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage<T extends keyof WsServerBroadcast>(
    data: ServerMessageInterface<T>,
  ): void {
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
        if (notificationData.payload.message == "Game started!") {
          this.loadingOverlay.hide();
          // added from game resume for now
          this.gameState.status = GameStatus.PLAYING;
          this.gameState.pauseInitiatedByMe = false;
          this.gameState.blockedPlayButton = false;
          this.game?.showGamePieces();
          this.hidePauseOverlay();
          this.gameStateCallback();
        }
        // in the case game is starting again after pause
        break;
      }
      case "game_update": {
        const gameUpdateData = data as ServerMessageInterface<"game_update">;
        this.game?.updateGameStateFromServer(gameUpdateData);
        if (!this.gameState.activePaddle) {
          this.gameState.activePaddle = gameUpdateData.payload.activePaddle;
          // change paddle pos to paddleB if we aren't A
          if (this.gameState.activePaddle != "paddleA") {
            [this.gameState.playerA, this.gameState.playerB] = [
              this.gameState.playerB,
              this.gameState.playerA,
            ];
          }
          this.initializeGame();
        }
        // score stuff
        this.gameState.playerA.score = gameUpdateData.payload.paddleA.score;
        this.gameState.playerB.score = gameUpdateData.payload.paddleB.score;
        // this.gameStateCallback();
        // need to refresh / change this when actual user ids exist
        this.scoreBar.updateScores(
          this.gameState.playerA.score,
          this.gameState.playerB.score,
        );
        break;
      }
      case "game_pause": {
        this.gameState.status = GameStatus.PAUSED;
        this.gameStateCallback();
        break;
      }
      case "game_ended": {
        this.gameState.status = GameStatus.GAME_OVER;
        this.showEndGameOverlay();
        // update score for end of game diff than during. TODO refresh on backend integration -> must use diff logic
        const gameEndData = data as ServerMessageInterface<"game_ended">;
        this.gameState.playerA.score = gameEndData.payload.scorePlayer1;
        this.gameState.playerB.score = gameEndData.payload.scorePlayer2;
        // this.gameStateCallback();
        // need to refresh / change this when actual user ids exist
        this.scoreBar.updateScores(
          this.gameState.playerA.score,
          this.gameState.playerB.score,
        );
        // implement actual winning logic here based on winning user id. not score. this is only temporary for now (while backend isnt synced)
        this.endResultText.innerText = `Winner: ${this.gameState.playerA.username}`;
      }
    }
  }
}
