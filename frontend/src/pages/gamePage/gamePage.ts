// components
import { Loading } from "../../components/loading";
import { ScoreBar } from "../../components/scoreBar";
import { Menu } from "../../components/menu";
import { ProfileAvatar } from "../../components/profileAvatar";

// types
import { GameState, GameStatus } from "../../types";
import { Direction, WsServerBroadcast } from "../../types/websocket";
import { User } from "../../types";

// services
import { Backend, Router, ServiceContainer, Websocket } from "../../services";
import { PongGame } from "../../game";
import { showError, showInfo } from "../../components/toast";

// functions
import { profilePrintToArray } from "../../utils/profilePrintFunctions";

export class GamePage {
  // HTML Elements
  protected main!: HTMLElement;
  protected gameContainer!: HTMLElement;
  protected menuPauseDiv: HTMLDivElement | null = null;
  protected pauseCountdown!: HTMLElement;
  protected menuEndDiv!: HTMLDivElement;
  protected endResultText!: HTMLElement;

  // components
  protected loadingOverlay!: Loading;
  protected scoreBar!: ScoreBar;
  protected game!: PongGame;

  // types
  protected gameState!: GameState;

  // services
  protected ws: Websocket;
  protected router: Router;
  protected backend: Backend;

  // data for game
  protected gameId!: string;

  // params
  protected params: URLSearchParams;

  // web socket config
  // set once we recieve gameReady from ws
  protected wsGameReady: boolean = false;

  // web socket handlers
  private boundWsCountdownHandler = this.wsCountdownHandler.bind(this);
  private boundWsNotificationHandler = this.wsNotificationHandler.bind(this);
  private boundWsGameUpdateHandler = this.wsGameUpdateHandler.bind(this);
  private boundWsGamePauseHandler = this.wsGamePauseHandler.bind(this);
  private boundWsGameEndedHandler = this.wsGameEndedHandler.bind(this);
  private boundWsStartGameHandler = this.wsStartGameHandler.bind(this);
  public boundWsGameReadyHandler = this.wsGameReadyHandler.bind(this);

  constructor(serviceContainer: ServiceContainer) {
    console.log("GamePage instance created");
    // services init
    this.ws = serviceContainer.get<Websocket>("websocket");
    this.router = serviceContainer.get<Router>("router");
    this.backend = serviceContainer.get<Backend>("backend");

    // register ws handlers
    this.registerWebsocketHandlers();

    // get params from URL
    this.params = this.router.getQueryParams();

    // build UI
    this.renderInitialUI();

    // default always show waiting screen
    this.showLoadingOverlay("waiting");
  }

  // build UI / scaffolding
  public renderInitialUI() {
    // main div
    this.main = document.createElement("div");
    this.main.className =
      "sys-window flex flex-col gap-1 w-full min-h-full items-center justify-center bg-[#0400FF]";
    // game container div
    this.gameContainer = document.createElement("div");
    this.gameContainer.className = "flex items-center justify-center relative";
  }

  // gameState -> for each page to do in its own way
  public intializeGameState() {}

  // make initial backend call
  // each page has its own logic here
  public async initializeBackend() {}

  // score bar
  public showScoreBar() {
    this.scoreBar.mount(this.main);
  }

  // game engine (component)
  public showGame() {
    this.main.appendChild(this.gameContainer);
    // only remount the game component to the game container if it hasnt already been (first time)
    if (!this.gameContainer.contains(this.game.getElement()))
      this.game.mount(this.gameContainer);
  }

  public hideGame() {
    this.main.removeChild(this.gameContainer);
  }

  // gameState handler (callback function)
  public gameStateCallback() {
    const currentKey = this.gameState.activeKey;
    console.log("game id on send", this.gameId);
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

  // loading overlay
  public showLoadingOverlay(loadingText: string) {
    this.loadingOverlay = new Loading(loadingText);
    this.loadingOverlay.mount(this.main);
  }

  public hideLoadingOverlay() {
    if (this.main.contains(this.loadingOverlay.getElement()))
      this.main.removeChild(this.loadingOverlay.getElement());
  }

  // register websocket handlers
  public registerWebsocketHandlers(): void {
    this.ws.onMessage("countdown_update", this.boundWsCountdownHandler);
    this.ws.onMessage("notification", this.boundWsNotificationHandler);
    this.ws.onMessage("game_update", this.boundWsGameUpdateHandler);
    this.ws.onMessage("game_pause", this.boundWsGamePauseHandler);
    this.ws.onMessage("game_ended", this.boundWsGameEndedHandler);
    this.ws.onMessage("game_start", this.boundWsStartGameHandler);
    this.ws.onMessage("game_ready", this.boundWsGameReadyHandler);
  }

  public async wsCountdownHandler(
    payload: WsServerBroadcast["countdown_update"],
  ) {
    if (payload.countdown) {
      // any time we see a countdown payload we change loading text to show it
      this.loadingOverlay.changeText(payload.countdown.toString());
      // if we are currently paused -> we show it as a notification to user
      if (this.gameState.status === GameStatus.PAUSED)
        showInfo(`game resumes in: ${payload.countdown.toString()}`);
    }
  }

  // use this esp in tournament
  public async wsNotificationHandler(
    _payload: WsServerBroadcast["notification"],
  ) {}

  public async wsGameUpdateHandler(payload: WsServerBroadcast["game_update"]) {
    if (!this.gameState) {
      showInfo("Game ended due to page refresh");
      this.unmount();
    }

    // set active paddle (side we are on) -> runs first time we get an update
    // then set up the score bar knowing which side we are on
    // then set up game knowing which side we are on
    if (!this.gameState.activePaddle) {
      this.gameState.activePaddle = payload.activePaddle;
      if (this.gameState.activePaddle != "paddleA") {
        [this.gameState.playerA, this.gameState.playerB] = [
          this.gameState.playerB,
          this.gameState.playerA,
        ];
      }

      // here we create a new game -> should only run once on start
      // initialize game component
      this.game = new PongGame(
        this.gameState,
        () => this.gameStateCallback(),
        "remote",
      );

      // initalize scoreBar component
      this.scoreBar = new ScoreBar(
        this.gameState,
        () => this.gameStateCallback(),
        () => this.ws.messageGamePause(this.gameId),
        () => this.ws.messageGameResume(this.gameId),
      );
    }

    // any time we get a game update handler we need to show the game
    // console.log(payload);

    // hide pause overlay -> game update sent after pause -> we unpause in line below
    if (this.gameState.status === GameStatus.PAUSED) this.hidePauseOverlay();

    // set game state for game engine to know whats up
    this.gameState.status = GameStatus.PLAYING;

    // make sure we are always showing the icon as a play icon
    this.scoreBar.pausePlay.toggleIsPlaying(true);

    // always need to hide loading screen when we receive game update (if it exists in main)
    if (this.main.contains(this.loadingOverlay.getElement()))
      this.hideLoadingOverlay();
    // showGame if it is not already being shown
    if (!this.main.contains(this.gameContainer)) {
      this.showScoreBar();
      this.showGame();
    }

    // push updates from web server to game engine to render
    this.game?.updateGameStateFromServer(payload);

    // keep scores up to date
    this.gameState.playerA.score = payload.paddleA.score;
    this.gameState.playerB.score = payload.paddleB.score;
    this.scoreBar.updateScores(
      this.gameState.playerA.score,
      this.gameState.playerB.score,
    );
  }

  public async wsGamePauseHandler() {
    this.gameState.status = GameStatus.PAUSED;
    this.scoreBar.pausePlay.toggleIsPlaying(false);
    this.showPauseOverlay();
  }

  public async wsGameEndedHandler(payload: WsServerBroadcast["game_ended"]) {
    this.gameState.status = GameStatus.GAME_OVER;
    console.log(payload);

    // old logic from remote game -> would handle individually in each page type but i think makes sense act to keep it here
    // AI is the only case where we use have null as a winner ID
    let winnerUser;
    console.log(payload);
    if (payload.winnerId && !payload.winnerId.startsWith("AI")) {
      winnerUser = await this.backend.getUserById(payload.winnerId);
      winnerUser.username = winnerUser.alias
        ? winnerUser.alias
        : winnerUser.username;
      winnerUser.colormap = profilePrintToArray(winnerUser.colormap);
    } else if (payload.winnerId?.startsWith("AI")) {
      // AI case
      winnerUser =
        this.gameState.playerA.username === "AI"
          ? this.gameState.playerA
          : this.gameState.playerB;
    }

    this.showEndGameOverlay(winnerUser);
  }

  public async wsGameReadyHandler(payload: WsServerBroadcast["game_ready"]) {
    console.log(payload);
    this.wsGameReady = true;
    console.log("Game ready!");
  }

  public async wsStartGameHandler(payload: WsServerBroadcast["game_start"]) {
    console.log(payload);
  }

  // poll the web socket for being ready to start the game
  public async pollWebsocketForGameReady(): Promise<boolean> {
    const timeout = 5000 * 6; // 5 seconds * 6 -> 30 seconds
    const interval = 100; // check every 100ms
    let elapsed = 0;

    return new Promise((resolve) => {
      const poll = () => {
        if (this.wsGameReady) {
          resolve(true);
        } else if (elapsed >= timeout) {
          showError("dropping connection. timed out");
          resolve(false);
        } else {
          elapsed += interval;
          setTimeout(poll, interval);
        }
      };
      poll();
    });
  }

  // pause overlay
  public showPauseOverlay(): void {
    this.game?.hideGamePieces();
    if (this.gameContainer && !this.menuPauseDiv) {
      this.menuPauseDiv = document.createElement("div");
      this.menuPauseDiv.className = "flex flex-col gap-5";
      // Create and mount menu to game container instead of main element
      const menuItems = [{ name: "quit", link: "/chat" }];
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

  private async showEndGameOverlay(winningUser: User) {
    this.game?.hideGamePieces();
    this.scoreBar.clear();
    if (this.gameContainer && !this.menuPauseDiv) {
      this.menuEndDiv = document.createElement("div");
      this.menuEndDiv.className = "flex flex-col gap-5 items-center";
      // Create and mount menu to game container instead of main element
      const menuItems = [{ name: "back", link: "/chat" }];
      const menuEnd = new Menu(this.router, menuItems);
      let avatar = new ProfileAvatar(
        winningUser.color,
        winningUser.colormap,
        40,
        40,
        2,
      );
      this.menuEndDiv.appendChild(avatar.getElement());
      this.endResultText = document.createElement("h1");
      this.endResultText.textContent = `${winningUser.username} wins this round`;
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

  public hideEndGameOverlay() {
    if (this.gameContainer.contains(this.menuEndDiv))
      this.gameContainer.removeChild(this.menuEndDiv);
  }

  // mount / unmount
  public async mount(parent: HTMLElement): Promise<void> {
    parent.appendChild(this.main);
  }

  protected cleanupWebsocket(): void {
    // unregister WebSocket handlers (example, depends on your ws API)
    this.ws.offMessage("countdown_update", this.boundWsCountdownHandler);
    this.ws.offMessage("notification", this.boundWsNotificationHandler);
    this.ws.offMessage("game_update", this.boundWsGameUpdateHandler);
    this.ws.offMessage("game_pause", this.boundWsGamePauseHandler);
    this.ws.offMessage("game_ended", this.boundWsGameEndedHandler);
    this.ws.offMessage("game_start", this.boundWsStartGameHandler);
    this.ws.offMessage("game_ready", this.boundWsGameReadyHandler);
  }

  protected cleanupBackend(): void {
    if (!this.gameState) {
      this.backend.deleteGame(this.gameId);
    } else if (this.gameState.status !== GameStatus.GAME_OVER) {
      this.ws.messageGameLeave(this.gameId);
    }
  }

  public unmount() {
    this.ws.messageGameLeave(this.gameId);
    // Cleanup backend (can be overridden by subclasses)
    this.cleanupBackend();

    // Cleanup WebSocket
    this.cleanupWebsocket();

    // Remove DOM
    this.main.remove();
  }
}
