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

    this.intializeGameState();
  }

  public async intializeGameState(): Promise<void> {
    // get game data from backend
    const response = await this.backend.getGameById(this.gameId);
    const gameData = response.data;
    // If game exists and has started, initialize it
    // not sure if this is the right way to error handle it but could work? -> need to test
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
    // if we resolve poll function to true then we let the web socket know we are ready
    if (await this.pollWebsocketForGameReady())
      this.ws.messageClientReady(this.gameId);
  }
}
