import { ServiceContainer, Router, Websocket, Backend } from "../../services";
import { PongGame } from "../../game";
import { GameState, GameStatus, User } from "../../types";
import { ScoreBar } from "../../components/scoreBar";
import { Loading } from "../../components/loading";
import { Menu } from "../../components/menu";
import { WsServerBroadcast, Direction } from "../../types/websocket";
import { ProfileAvatar } from "../../components/profileAvatar";
import {
  generateProfilePrint,
  profilePrintToArray,
} from "../../utils/profilePrintFunctions";

export type GameType = "ai" | "vs-player" | "tournament";

export class VsPlayerGamePage {
  private main: HTMLElement;
  private game: PongGame | null = null;
  // initialize game state in create() now
  private gameState!: GameState;
  private scoreBar!: ScoreBar;
  private menuPauseDiv: HTMLDivElement | null = null;
  private gameContainer: HTMLElement | null = null;
  private loadingOverlay: Loading;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private pauseCountdown!: HTMLElement;
  private menuEndDiv!: HTMLDivElement;
  private endResultText!: HTMLElement;
  private ws: Websocket;
  private backend: Backend;
  private gameId!: string;
  private userMe!: User;
  private userOther!: User;
  private gameType!: GameType;

  constructor(serviceContainer: ServiceContainer) {
    // services
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.ws = this.serviceContainer.get<Websocket>("websocket");
    this.backend = this.serviceContainer.get<Backend>("backend");

    // check which player is meant to be where

    this.main = document.createElement("div");
    this.main.className =
      "sys-window flex flex-col gap-1 w-full min-h-full items-center justify-center bg-[#0400FF]";

    // register web socket handlers
    this.registerWebsocketHandlers();

    // grab data from backend
    // get web socket before countdown
    this.loadingOverlay = new Loading("waiting for opponent", "button", () =>
      this.quitHook(),
    );
    this.loadingOverlay.mount(this.main);

    this.main.appendChild(this.loadingOverlay.getElement());
  }

  public static async create(
    serviceContainer: ServiceContainer,
  ): Promise<VsPlayerGamePage> {
    const instance = new VsPlayerGamePage(serviceContainer);

    // get game type from url params in router
    const router = serviceContainer.get<Router>("router");
    const params = router.getQueryParams();
    const gameType = (params.get("gameType") as GameType) || "vs-player";
    instance.gameType = gameType;

    console.log("game type: ", gameType, "params: ", params);

    // call appropriate backend method based on game type
    let response;
    switch (gameType) {
      case "ai": {
        const aiDifficulty = params.get("aiDifficulty") || "medium";
        response = await instance.backend.createAiGame(aiDifficulty);
        // need to talk to moritz about this
        instance.gameId = response.gameRet.gameId;
        break;
      }
      case "tournament":
        response = await instance.backend.joinTournament("alias-demo");
        break;
      case "vs-player":
      default:
        response = await instance.backend.joinGame();
        instance.gameId = response.gameId;
        break;
    }
    console.log("game ID on create is: ", instance.gameId);

    // save the user (me) to remote game to use later
    const responseUser = await instance.backend.getUser();
    instance.userMe = responseUser;

    // Initialize gameState with complete data
    instance.gameState = {
      status: GameStatus.PLAYING,
      previousStatus: GameStatus.PLAYING,
      playerA: {
        ...instance.userMe,
        score: 0,
      },
      pauseInitiatedByMe: false,
      blockedPlayButton: false,
      activeKey: "",
      previousKey: "",
      activePaddle: undefined,
      wsPaddleSequence: 0,
    };

    // load mock AI player for AI game type
    if (instance.gameType === "ai") {
      const { color, colorMap } = generateProfilePrint();
      const otherUser: User = {
        colormap: colorMap,
        color: color,
        userId: "ai69",
        username: "AI",
        createdAt: "",
        updatedAt: "",
        email: "",
        password_hash: "",
        avatar: "",
        tfaEnabled: false,
        twofa_secret: "",
        guest: false,
      };
      instance.gameState.playerB = {
        ...otherUser,
        score: 0,
      };
      instance.userOther = otherUser;
    }

    return instance;
  }

  private registerWebsocketHandlers(): void {
    this.ws.onMessage("countdown_update", this.wsCountdownHandler.bind(this));
    this.ws.onMessage("notification", this.wsNotificationHandler.bind(this));
    this.ws.onMessage("game_update", this.wsGameUpdateHandler.bind(this));
    this.ws.onMessage("game_pause", this.wsGamePauseHandler.bind(this));
    this.ws.onMessage("game_ended", this.wsGameEndedHandler.bind(this));
    this.ws.onMessage("game_start", this.wsStartGameHandler.bind(this));
  }

  // this happens at start of the game
  private async wsStartGameHandler(payload: WsServerBroadcast["game_start"]) {
    if (this.gameType === "ai") return;
    // only for vs player and tournament
    // finds the user that is not userMe
    const otherUserId = payload.players.find(
      (player) => player.userId !== this.userMe.userId,
    );

    if (!otherUserId) return;

    const otherUser = await this.backend.getUserById(otherUserId.userId);
    otherUser.colormap = profilePrintToArray(otherUser.colormap);
    this.gameState.playerB = {
      ...otherUser,
      score: 0,
    };
    this.userOther = otherUser;
  }

  private wsCountdownHandler(
    payload: WsServerBroadcast["countdown_update"],
  ): void {
    const message = payload.message;
    if (
      this.gameState.status == GameStatus.PAUSED ||
      (this.gameState.status == GameStatus.PLAYING &&
        this.gameState.pauseInitiatedByMe == true)
    ) {
      this.pauseCountdown.innerText = "game resumes in: " + message;
      if (message == "GO!") {
        this.pauseCountdown.innerText = message;
      }
      // could do a show info in here instead but looked cluttered
    } else {
      this.loadingOverlay.changeText(message);
      if (message == "GO!") this.loadingOverlay.hide();
    }
  }

  private wsNotificationHandler(
    payload: WsServerBroadcast["notification"],
  ): void {
    const message = payload.message;
    if (message == "Game started!" || message == "Game resumed!") {
      this.loadingOverlay.hide();
      // added from game resume for now
      this.gameState.status = GameStatus.PLAYING;
      this.gameState.pauseInitiatedByMe = false;
      this.gameState.blockedPlayButton = false;
      this.game?.showGamePieces();
      if (message === "Game resumed!") {
        this.hidePauseOverlay();
        this.scoreBar.pausePlay.toggleIsPlaying(true);
      }
      this.gameStateCallback();
    }
  }

  private async wsGameUpdateHandler(payload: WsServerBroadcast["game_update"]) {
    this.game?.updateGameStateFromServer(payload);
    // check to make sure everythig it set right
    if (!this.gameState.playerB) return;
    if (!this.userOther) return;
    if (!this.gameState.activePaddle) {
      this.gameState.activePaddle = payload.activePaddle;
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
    this.gameState.playerA.score = payload.paddleA.score;
    this.gameState.playerB.score = payload.paddleB.score;
    // this.gameStateCallback();
    // need to refresh / change this when actual user ids exist
    this.scoreBar.updateScores(
      this.gameState.playerA.score,
      this.gameState.playerB.score,
    );
  }

  private wsGamePauseHandler(): void {
    this.gameState.status = GameStatus.PAUSED;
    this.scoreBar.pausePlay.toggleIsPlaying(false);
    this.showPauseOverlay();
    this.gameStateCallback();
  }

  private async wsGameEndedHandler(payload: WsServerBroadcast["game_ended"]) {
    this.gameState.status = GameStatus.GAME_OVER;

    // game winner will be null if AI
    let winnerUser;
    if (payload.winnerId) {
      winnerUser = await this.backend.getUserById(payload.winnerId);
      winnerUser.colormap = profilePrintToArray(winnerUser.colormap);
    } else {
      // AI case
      winnerUser =
        this.gameState.playerA.username === "AI"
          ? this.gameState.playerA
          : this.gameState.playerB;
    }

    this.showEndGameOverlay(winnerUser);
    // update score for end of game diff than during. TODO refresh on backend integration -> must use diff logic
    this.gameState.playerA.score = payload.scorePlayer1;
    if (!this.gameState.playerB) return;
    this.gameState.playerB.score = payload.scorePlayer2;
    // need to refresh / change this when actual user ids exist
    this.scoreBar.updateScores(
      this.gameState.playerA.score,
      this.gameState.playerB.score,
    );
    // implement actual winning logic here based on winning user id. not score. this is only temporary for now (while backend isnt synced)

    const winner = winnerUser.username ? winnerUser.username : "AI";
    this.endResultText.innerText = `Winner: ${winner}`;
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

    this.scoreBar = new ScoreBar(
      this.gameState,
      () => this.gameStateCallback(),
      () => this.ws.messageGamePause(this.gameId),
      () => this.ws.messageGameResume(this.gameId),
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
      const menuItems = [{ name: "quit", onClick: () => this.quitHook() }];
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

  private quitHook() {
    this.ws.messageGameLeave(this.gameId);
    this.unmount();
    this.router.navigate("/chat");
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
    if (this.scoreBar && this.gameState.playerB) {
      this.scoreBar.updateScores(
        this.gameState.playerA.score,
        this.gameState.playerB.score,
      );
    }

    const currentKey = this.gameState.activeKey;
    if (currentKey != this.gameState.previousKey) {
      // key event handling
      if (currentKey == "KEY_UP") {
        this.ws.messageGameUpdateDirection(
          Direction.UP,
          this.gameState.wsPaddleSequence,
          this.gameId,
        );
      } else if (currentKey == "KEY_DOWN") {
        this.ws.messageGameUpdateDirection(
          Direction.DOWN,
          this.gameState.wsPaddleSequence,
          this.gameId,
        );
      } else if (currentKey == "") {
        this.ws.messageGameUpdateDirection(
          Direction.STOP,
          this.gameState.wsPaddleSequence,
          this.gameId,
        );
      }
      this.gameState.previousKey = currentKey;
    }

    // old pause play logic
    // // pause play stuff
    // // playing
    // if (
    //   this.gameState.status == GameStatus.PLAYING &&
    //   this.gameState.previousStatus == GameStatus.PAUSED
    // ) {
    //   this.scoreBar.pausePlay.toggleIsPlaying(true);
    //   this.gameState.previousStatus = GameStatus.PLAYING;
    //   if (this.gameState.pauseInitiatedByMe == true) {
    //     this.ws.messageGameResume(this.gameId);
    //   }
    //   // paused
    // } else if (
    //   this.gameState.status == GameStatus.PAUSED &&
    //   this.gameState.previousStatus == GameStatus.PLAYING
    // ) {
    //   this.scoreBar.pausePlay.toggleIsPlaying(false);
    //   this.game?.hideGamePieces();
    //   this.showPauseOverlay();
    //   // send game pause to ws
    //   this.gameState.previousStatus = GameStatus.PAUSED;
    //   if (this.gameState.pauseInitiatedByMe == true) {
    //     this.ws.messageGamePause(this.gameId);
    //   } else {
    //     this.gameState.blockedPlayButton = true;
    //   }
    // }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    // Send leave message before cleaning up handlers
    if (this.gameId) {
      this.ws.messageGameLeave(this.gameId);
    }
    // clean up WebSocket handlers to prevent memory leaks and duplicate handlers
    this.ws.clearHandlers("countdown_update");
    this.ws.clearHandlers("notification");
    this.ws.clearHandlers("game_update");
    this.ws.clearHandlers("game_pause");
    this.ws.clearHandlers("game_ended");
    this.ws.clearHandlers("game_start");
    // Clean up game instance
    if (this.game) {
      this.game.unmount();
      this.game = null;
    }
    // Fix: Call unmount method properly
    this.loadingOverlay.unmount();
    this.main.remove();
  }

  private async showEndGameOverlay(user: User) {
    this.game?.hideGamePieces();
    this.scoreBar.clear();
    if (this.gameContainer && !this.menuPauseDiv) {
      this.menuEndDiv = document.createElement("div");
      this.menuEndDiv.className = "flex flex-col gap-5 items-center";
      // Create and mount menu to game container instead of main element
      const menuItems = [{ name: "quit", link: "/chat" }];
      const menuEnd = new Menu(this.router, menuItems);
      let avatar = new ProfileAvatar(user.color, user.colormap, 40, 40, 2);
      this.menuEndDiv.appendChild(avatar.getElement());
      this.endResultText = document.createElement("h1");
      this.endResultText.textContent = `${user.username} wins`;
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
}
