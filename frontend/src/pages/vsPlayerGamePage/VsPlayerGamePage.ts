import { ServiceContainer } from "../../services";
import { GamePage } from "../gamePage";

export class VsPlayerGamePage extends GamePage {
  constructor(serviceContainer: ServiceContainer) {
    // call to template / parent we inherit from
    super(serviceContainer);

    this.initializeBackend();
    this.intializeGameState();
  }

  public async initializeBackend(): Promise<void> {
    const response = await this.backend.joinGame();
    this.gameId = response.gameId;

    // needs to be at very end
    // if we resolve poll function to true then we let the web socket know we are ready
    if (await this.pollWebsocketForGameReady())
      this.ws.messageClientReady(this.gameId);
  }
}
