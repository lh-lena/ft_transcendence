// components
import { Loading } from "../../components/loading";
import { ScoreBar } from "../../components/scoreBar";

// types
import { GameState, GameStatus } from "../../types";
import { Direction, WsServerBroadcast } from "../../types/websocket";

// services
import { Backend, Router, ServiceContainer, Websocket } from "../../services";
import { PongGame } from "../../game";

export class GamePage {
  // HTML Elements
  protected main!: HTMLElement;
  protected gameContainer!: HTMLElement;

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

  constructor(serviceContainer: ServiceContainer) {
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
    this.main.removeChild(this.loadingOverlay.getElement());
  }

  // register websocket handlers
  public registerWebsocketHandlers(): void {
    this.ws.onMessage("countdown_update", this.wsCountdownHandler.bind(this));
    this.ws.onMessage("notification", this.wsNotificationHandler.bind(this));
    this.ws.onMessage("game_update", this.wsGameUpdateHandler.bind(this));
    this.ws.onMessage("game_pause", this.wsGamePauseHandler.bind(this));
    this.ws.onMessage("game_ended", this.wsGameEndedHandler.bind(this));
    this.ws.onMessage("game_start", this.wsStartGameHandler.bind(this));
  }

  public wsCountdownHandler(
    payload: WsServerBroadcast["countdown_update"],
  ): void {
    if (payload.countdown) {
      // any time we see a countdown payload we change loading text to show it
      this.loadingOverlay.changeText(payload.countdown.toString());
    }
  }

  public wsNotificationHandler(
    payload: WsServerBroadcast["notification"],
  ): void {
    console.log(payload);
  }

  private async wsGameUpdateHandler(payload: WsServerBroadcast["game_update"]) {
    // any time we get a game update handler we need to show the game
    // console.log(payload);

    // set game state for game engine to know whats up
    this.gameState.status = GameStatus.PLAYING;

    // make sure we are always showing the icon as a play icon
    this.scoreBar.pausePlay.toggleIsPlaying(true);

    // set active paddle (side we are on) -> runs first time we get an update
    if (!this.gameState.activePaddle) {
      this.gameState.activePaddle = payload.activePaddle;
      if (this.gameState.activePaddle != "paddleA") {
        [this.gameState.playerA, this.gameState.playerB] = [
          this.gameState.playerB,
          this.gameState.playerA,
        ];
      }
    }

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

  public wsGamePauseHandler(): void {
    this.gameState.status = GameStatus.PAUSED;
    this.scoreBar.pausePlay.toggleIsPlaying(false);
  }

  public wsGameEndedHandler(payload: WsServerBroadcast["game_ended"]) {
    this.gameState.status = GameStatus.GAME_OVER;
    console.log(payload);
  }

  public wsStartGameHandler(payload: WsServerBroadcast["game_start"]) {
    console.log(payload);

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

  // mount / unmount
  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount() {
    // Remove DOM
    this.main.remove();

    // cleanup in backend or websocket depending on game state
    // cleanup during waiting screen
    if (this.gameState.status === GameStatus.WAITING) {
      this.backend.deleteGame(this.gameId);
    } else if (this.gameState.status !== GameStatus.GAME_OVER) {
      this.ws.messageGameLeave(this.gameId);
    }

    // Unregister WebSocket handlers (example, depends on your ws API)
    this.ws.offMessage("countdown_update", this.wsCountdownHandler.bind(this));
    this.ws.offMessage("notification", this.wsNotificationHandler.bind(this));
    this.ws.offMessage("game_update", this.wsGameUpdateHandler.bind(this));
    this.ws.offMessage("game_pause", this.wsGamePauseHandler.bind(this));
    this.ws.offMessage("game_ended", this.wsGameEndedHandler.bind(this));
    this.ws.offMessage("game_start", this.wsStartGameHandler.bind(this));
  }
}
