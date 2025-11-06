// parent page
import { GamePage } from "../gamePage";

// services
import { ServiceContainer } from "../../services";

// types
import { GameStatus } from "../../types";

// functions
import { profilePrintToArray } from "../../utils/profilePrintFunctions";
import { showError } from "../../components/toast";

export class VsPlayerGamePage extends GamePage {
  constructor(serviceContainer: ServiceContainer) {
    // call to template / parent we inherit from
    super(serviceContainer);

    this.initializeBackend();
  }

  public async initializeBackend(): Promise<void> {
    const response = await this.backend.joinGame();
    this.gameId = response.gameId;
    console.log("this gameId", this.gameId);
    if (await this.pollWebsocketForGameReady()) {
      await this.intializeGameState();
    }
  }

  public async intializeGameState(): Promise<void> {
    // get game data from backend
    const response = await this.backend.getGameById(this.gameId);
    const gameData = response.data;
    // If game exists and has started, initialize it
    if (!gameData && gameData.players && gameData.players.length === 2) {
      showError("couldn't fetch players. please try again");
      this.router.navigate("/chat");
    }
    // get other users id from the game data
    const otherUserId = gameData.players.find(
      (player: { userId: string }) =>
        player.userId !== this.backend.getUser().userId,
    );
    // get other user by the ID we just found
    const otherUser = await this.backend.getUserById(otherUserId.userId);
    otherUser.colormap = profilePrintToArray(otherUser.colormap);
    // Initialize gameState with both users
    this.gameState = {
      status: GameStatus.WAITING,
      previousStatus: GameStatus.WAITING,
      playerA: {
        ...this.backend.getUser(),
        score: 0,
      },
      playerB: {
        ...otherUser,
        score: 0,
      },
      pauseInitiatedByMe: false,
      blockedPlayButton: false,
      activeKey: "",
      previousKey: "",
      activePaddle: undefined,
      wsPaddleSequence: 0,
    };
    // needs to be at very end
    // need to let the ws know we are ready to start playing
    this.ws.messageClientReady(this.gameId);
  }
}
