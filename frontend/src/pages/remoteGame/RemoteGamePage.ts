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
  private loadingOverlay!: Loading;
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

    window.addEventListener("beforeunload", this.handleWindowClose.bind(this));

    this.main = document.createElement("div");
    this.main.className =
      "sys-window flex flex-col gap-1 w-full min-h-full items-center justify-center bg-[#0400FF]";

    // register web socket handlers
    this.registerWebsocketHandlers();

    // get web socket before countdown
    this.loadingOverlay = new Loading("waiting for opponent");
    this.loadingOverlay.mount(this.main);

    this.main.appendChild(this.loadingOverlay.getElement());

    this.setupGame();
  }

  // add event as args in case you want to confirm user wants to close window
  private handleWindowClose() {
    // Clean up WebSocket connections
    if (this.gameState.status === GameStatus.WAITING) {
      this.backend.deleteGame(this.gameId);
    } else if (
      this.gameState.status === GameStatus.PLAYING ||
      this.gameState.status === GameStatus.PAUSED
    ) {
      this.ws.messageGameLeave(this.gameId);
    }
  }

  public async setupGame() {
    const params = this.router.getQueryParams();
    const gameType = (params.get("gameType") as GameType) || "vs-player";
    this.gameType = gameType;

    console.log("game type: ", gameType, "params: ", params);

    // call appropriate backend method based on game type
    let response;
    switch (gameType) {
      case "ai": {
        const aiDifficulty = params.get("aiDifficulty") || "medium";
        response = await this.backend.createAiGame(aiDifficulty);
        // need to talk to moritz about this
        this.gameId = response.gameId;
        break;
      }
      case "tournament": {
        this.gameId = params.get("gameId") || "undefined";
        break;
      }
      case "vs-player":
      default:
        // we initiate game flow with backend if we arent arriving through an invite
        if (params.get("source") !== "invite") {
          response = await this.backend.joinGame();
          this.gameId = response.gameId;
        } else if (params.get("source") === "invite") {
          const gameId = params.get("gameId");
          if (gameId) this.gameId = gameId;
        }
        break;
    }

    // debug
    console.log("game ID on create is: ", this.gameId);

    // save the user (me) to remote game to use later
    const responseUser = await this.backend.getUser();
    this.userMe = responseUser;

    // Initialize gameState with complete data
    this.gameState = {
      status: GameStatus.WAITING,
      previousStatus: GameStatus.WAITING,
      playerA: {
        ...this.userMe,
        username: responseUser.alias ? this.userMe.alias : this.userMe.username,
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
    if (this.gameType === "ai") {
      const { color, colorMap } = generateProfilePrint();
      const otherUser: User = {
        colormap: colorMap,
        color: color,
        userId: "ai69",
        username: "AI",
        alias: "AI",
        createdAt: "",
        updatedAt: "",
        email: "",
        password_hash: "",
        avatar: "",
        tfaEnabled: false,
        twofa_secret: "",
        guest: false,
      };
      this.gameState.playerB = {
        ...otherUser,
        score: 0,
      };
      this.userOther = otherUser;
    }

    // NOW handle tournament game_start after everything is initialized
    if (this.gameType === "tournament") {
      const gameStartPayloadStr = params.get("gameStartPayload");
      if (gameStartPayloadStr) {
        const gameStartPayload = JSON.parse(gameStartPayloadStr);
        await this.wsStartGameHandler(gameStartPayload);
      }
    }
  }

  private registerWebsocketHandlers(): void {
    this.ws.onMessage("countdown_update", this.wsCountdownHandler.bind(this));
    this.ws.onMessage("notification", this.wsNotificationHandler.bind(this));
    this.ws.onMessage("game_update", this.wsGameUpdateHandler.bind(this));
    this.ws.onMessage("game_pause", this.wsGamePauseHandler.bind(this));
    this.ws.onMessage("game_ended", this.wsGameEndedHandler.bind(this));
    this.ws.onMessage("game_start", this.wsStartGameHandler.bind(this));
  }

  // // because start game fires before we can handle it on tournament page
  // private async tournamentStartGameHandler() {
  //   // set game status in ws to playing
  //   this.ws.setGameStatusPlaying();

  //   const response = await this.backend.getGameById(this.gameId);

  //   // Find the other player from the players array
  //   const otherUserId = response.players.find(
  //     (player: { userId: string }) => player.userId !== this.userMe.userId,
  //   );

  //   const otherUser = await this.backend.getUserById(otherUserId.userId);
  //   otherUser.colormap = profilePrintToArray(otherUser.colormap);
  //   this.gameState.playerB = {
  //     ...otherUser,
  //     score: 0,
  //   };
  //   this.userOther = otherUser;
  //   console.log("OTHER USER: ", otherUser);
  // }

  // this happens at start of the game
  private async wsStartGameHandler(payload: WsServerBroadcast["game_start"]) {
    console.log("START GAME INITIATED!");
    console.log("PAYLOAD", payload);
    if (!this.gameId) this.gameId = payload.gameId;

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
      username: otherUser.alias ? otherUser.alias : otherUser.username,
      score: 0,
    };
    this.userOther = otherUser;
    console.log("OTHER USER: ", otherUser);
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
        this.gameState.status = GameStatus.PLAYING;
        this.gameState.pauseInitiatedByMe = false;
        this.gameState.blockedPlayButton = false;
        this.game?.showGamePieces();
        this.hidePauseOverlay();
        this.scoreBar.pausePlay.toggleIsPlaying(true);
      }
      // could do a show info in here instead but looked cluttered
    } else {
      this.loadingOverlay.changeText(message);
      this.loadingOverlay.hideButton();
      if (message == "GO!") {
        this.loadingOverlay.hide();
        this.gameState.status = GameStatus.PLAYING;
      }
    }
  }

  private wsNotificationHandler(
    payload: WsServerBroadcast["notification"],
  ): void {
    const message = payload.message;
    // if (message == "Game started!" || message == "Game resumed!") {
    //   this.loadingOverlay.hide();
    //   // added from game resume for now
    //   this.gameState.status = GameStatus.PLAYING;
    //   this.gameState.pauseInitiatedByMe = false;
    //   this.gameState.blockedPlayButton = false;
    //   this.game?.showGamePieces();
    //   if (message === "Game resumed!") {
    //     this.hidePauseOverlay();
    //     this.scoreBar.pausePlay.toggleIsPlaying(true);
    //   }
    // this.gameStateCallback();

    console.log(message);
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
    // just always make sure if we get a game update the board is showing showGamePieces
    this.loadingOverlay.hide();
    this.hidePauseOverlay();
  }

  private wsGamePauseHandler(): void {
    this.gameState.status = GameStatus.PAUSED;
    this.scoreBar.pausePlay.toggleIsPlaying(false);
    this.showPauseOverlay();
    this.gameStateCallback();
  }

  private async wsGameEndedHandler(payload: WsServerBroadcast["game_ended"]) {
    this.gameState.status = GameStatus.GAME_OVER;

    // set game status in ws
    this.ws.setGameStatusNotPlaying();

    // game winner will be null if AI
    let winnerUser;
    console.log(payload);
    if (payload.winnerId) {
      winnerUser = await this.backend.getUserById(payload.winnerId);
      winnerUser.username = winnerUser.alias
        ? winnerUser.alias
        : winnerUser.username;
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
    // old ws callback
    // this.ws.messageGameLeave(this.gameId);
    this.backend.deleteGame(this.gameId);
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
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    // Send leave message before cleaning up handlers
    if (this.gameState.status === GameStatus.WAITING)
      // backend leave (delete)
      this.backend.deleteGame(this.gameId);
    else if (
      // web socket leave
      this.gameState.status === GameStatus.PLAYING ||
      this.gameState.status === GameStatus.PAUSED
    ) {
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
      const menuItems = [{ name: "back", link: "/chat" }];
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
