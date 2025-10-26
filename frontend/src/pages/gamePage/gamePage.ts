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
  private boundWsGameReadyHandler = this.wsGameReadyHandler.bind(this);

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
    }
  }

  public async wsNotificationHandler(
    payload: WsServerBroadcast["notification"],
  ) {
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

  public async wsGamePauseHandler() {
    this.gameState.status = GameStatus.PAUSED;
    this.scoreBar.pausePlay.toggleIsPlaying(false);
  }

  public async wsGameEndedHandler(payload: WsServerBroadcast["game_ended"]) {
    this.gameState.status = GameStatus.GAME_OVER;
    console.log(payload);
  }

  public async wsGameReadyHandler() {
    this.wsGameReady = true;
    console.log("Game ready!");
  }

  public async wsStartGameHandler(payload: WsServerBroadcast["game_start"]) {
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

  // poll the web socket for being ready to start the game
  public async pollWebsocketForGameReady(): Promise<boolean> {
    const timeout = 5000; // 5 seconds
    const interval = 100; // check every 100ms
    let elapsed = 0;

    return new Promise((resolve) => {
      const poll = () => {
        if (this.wsGameReady) {
          resolve(true);
        } else if (elapsed >= timeout) {
          // Optionally, you can call unmount or handle exit here
          resolve(false);
        } else {
          elapsed += interval;
          setTimeout(poll, interval);
        }
      };
      poll();
    });
  }

  // mount / unmount
  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount() {
    // cleanup in backend or websocket depending on game state
    // cleanup during waiting screen
    if (this.gameState.status === GameStatus.WAITING) {
      this.backend.deleteGame(this.gameId);
    } else if (this.gameState.status !== GameStatus.GAME_OVER) {
      this.ws.messageGameLeave(this.gameId);
    }

    // Unregister WebSocket handlers (example, depends on your ws API)
    this.ws.offMessage("countdown_update", this.boundWsCountdownHandler);
    this.ws.offMessage("notification", this.boundWsNotificationHandler);
    this.ws.offMessage("game_update", this.boundWsGameUpdateHandler);
    this.ws.offMessage("game_pause", this.boundWsGamePauseHandler);
    this.ws.offMessage("game_ended", this.boundWsGameEndedHandler);
    this.ws.offMessage("game_start", this.boundWsStartGameHandler);
    this.ws.offMessage("game_ready", this.boundWsGameReadyHandler);

    // Remove DOM
    this.main.remove();
  }
}
