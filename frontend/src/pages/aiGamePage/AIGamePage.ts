// parent class
import { GamePage } from "../gamePage";

// services
import { ServiceContainer } from "../../services";

// types
import { GameStatus } from "../../types";

// functions
import { generateProfilePrint } from "../../utils/profilePrintFunctions";

export class AIGamePage extends GamePage {
  constructor(serviceContainer: ServiceContainer) {
    console.log("AIpage instance created");
    // call to template / parent we inherit from
    super(serviceContainer);

    // make initial call to backend
    // probs put an if in here to check if we already have a game running?
    this.initializeBackend();
    this.intializeGameState();
  }

  public async initializeBackend(): Promise<void> {
    const response = await this.backend.createAiGame("medium");
    this.gameId = response.gameId;
    console.log("backend game id", response.gameId, this.gameId);
    // if we resolve poll function to true then we let the web socket know we are ready
    if (await this.pollWebsocketForGameReady())
      this.ws.messageClientReady(this.gameId);
  }

  public intializeGameState(): void {
    // user for AI (AI user, i make up a bunch of attributes)
    const { color, colorMap } = generateProfilePrint();
    const AIUser = {
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
    // Initialize gameState with both users
    this.gameState = {
      status: GameStatus.WAITING,
      previousStatus: GameStatus.WAITING,
      playerA: {
        ...this.backend.getUser(),
        score: 0,
      },
      playerB: {
        ...AIUser,
        score: 0,
      },
      pauseInitiatedByMe: false,
      blockedPlayButton: false,
      activeKey: "",
      previousKey: "",
      activePaddle: undefined,
      wsPaddleSequence: 0,
    };
  }
}
