// services
import { ServiceContainer } from "../../services";

// mother page
import { GamePage } from "../gamePage";

// components
import { Menu } from "../../components/menu";
import { ProfileAvatar } from "../../components/profileAvatar";

// web socket import for notitification handler
import { WsServerBroadcast } from "../../types/websocket";

// types
import { TournamentData } from "../../types/tournament";
import { GameStatus, GameState } from "../../types";

// functions
import { profilePrintToArray } from "../../utils/profilePrintFunctions";
import { showError } from "../../components/toast";

// IMPORTANT TO REMEMBER
// we receive gameID from game_update when ws also sends game ready
// so we save it in gamePage

export class TournamentGamePage extends GamePage {
  // game mode specific data
  private alias!: string;
  private tournamentId!: string;
  private isGuest: boolean;

  // dom (UI) elements
  private form!: HTMLElement;
  private inputAlias!: HTMLInputElement;
  private menu!: Menu;
  private tournamentStatsDiv!: HTMLDivElement;

  constructor(serviceContainer: ServiceContainer) {
    super(serviceContainer);

    // Re-bind the handler to ensure the subclass method is used
    // this.boundWsGameReadyHandler = this.wsGameReadyHandler.bind(this);

    // we have two elses here because sometimes there is still a stale entry for some reason
    // on logout i try to clear it as ""
    // so it resolves to guest if we get a runtime error or the length of user id is 0
    try {
      const tempUserId = this.backend.getUser()?.userId;
      if (tempUserId) this.isGuest = false;
      else this.isGuest = true;
    } catch (error) {
      this.isGuest = true;
      console.log(error);
    }

    // UI inital stuff for tournament alias page (from default game page setup)
    this.hideLoadingOverlay();
    this.showAliasForm();
  }

  // custom game ready for tournament
  public async wsGameReadyHandler(
    payload: WsServerBroadcast["game_ready"],
  ): Promise<void> {
    // call to base class
    super.wsGameReadyHandler(payload);
    // this is where we set game id and start game shit
    this.gameId = payload.game_id;

    // same ol initialize backend
    this.initializeBackend();
  }

  public async initializeBackend(): Promise<void> {
    const response = await this.backend.joinGame();
    this.gameId = response.gameId;
    if (await this.pollWebsocketForGameReady()) {
      this.intializeGameState();
    }
  }

  public async wsGameUpdateHandler(
    payload: WsServerBroadcast["game_update"],
  ): Promise<void> {
    super.wsGameUpdateHandler(payload);
    // hide bracket on game start
    this.hideBracket();
    // in case we end game and resume then for second game
    this.hideEndGameOverlay();
  }

  public async intializeGameState(): Promise<GameState> {
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
    return this.gameState;
  }

  private async handlePlayButton() {
    // grab alias
    this.alias = this.inputAlias.value.trim();

    if (this.alias.length === 0) {
      showError("must provide an alias");
      return;
    }

    // hide form UI
    this.hideAliasForm();

    // show loading overlay
    this.showLoadingOverlay("waiting");

    // if we have a guest we set the guest user
    if (this.isGuest) {
      const response = await this.backend.registerGuest(this.alias);
      console.log("alias guest: ", response);
    }

    this.initializeTournament();
  }

  public async initializeTournament(): Promise<void> {
    // two diff kinds of calls for join tournament depending on user type
    // for registered we need to still patch the alias so extra arg
    const response = this.isGuest
      ? await this.backend.joinTournament(this.alias)
      : await this.backend.joinTournament(this.alias, "registered");
    this.tournamentId = response.data.tournamentId;
    console.log(this.tournamentId);
    // Axios responses contain the server payload under `data`

    // show initial bracket
    this.showBracket(response.data);
  }

  private showAliasForm() {
    this.form = document.createElement("form");
    this.form.className = "flex flex-col gap-3 w-48 mb-5";
    this.main.appendChild(this.form);

    // email input
    this.inputAlias = document.createElement("input");
    this.inputAlias.type = "text";
    this.inputAlias.id = "text_alias";
    this.inputAlias.placeholder = "alias";
    this.inputAlias.style.paddingLeft = "0.5em";
    this.form.appendChild(this.inputAlias);

    const aliasMenu = [
      { name: "play", onClick: () => this.handlePlayButton() },
    ];
    this.menu = new Menu(this.router, aliasMenu);
    this.main.appendChild(this.menu.getMenuElement());
  }

  private hideAliasForm() {
    this.main.removeChild(this.form);
    this.main.removeChild(this.menu.getMenuElement());
  }

  public async wsNotificationHandler(
    _payload: WsServerBroadcast["notification"],
  ) {
    if (_payload.message === "INFO: New player joined the tournament") {
      // grab new tournament data from backend with new players
      const newTournamentData = await this.backend.getTournamentById(
        this.tournamentId,
      );
      console.log(newTournamentData);
      console.log(_payload);
      this.showBracket(newTournamentData.data);
    }
  }

  // makes a bracket
  private async showBracket(tournamentData: TournamentData) {
    this.hideLoadingOverlay();
    console.log("show bracket called");

    if (this.main.contains(this.tournamentStatsDiv))
      this.main.removeChild(this.tournamentStatsDiv);

    // Ensure all player data is populated before rendering
    await Promise.all(
      tournamentData.players.map(async (player) => {
        const user = await this.backend.getUserById(player.userId);
        player.alias = user.alias;
        player.color = user.color;
        player.colormap = profilePrintToArray(user.colormap);
        player.avatar = user.avatar;
        player.userId = user.userId;
      }),
    );

    this.tournamentStatsDiv = document.createElement("div");
    this.tournamentStatsDiv.className = "flex flex-col gap-8";
    this.main.appendChild(this.tournamentStatsDiv);

    // Group players in pairs
    for (let i = 0; i < tournamentData.players.length; i += 2) {
      const gameTitle = document.createElement("h1");
      gameTitle.className = "text-white text-2xl text-center";
      gameTitle.innerText = `game ${i / 2 + 1}: `;
      this.tournamentStatsDiv.appendChild(gameTitle);

      // Create a row container for the pair
      const gameRow = document.createElement("div");
      gameRow.className = "flex flex-row gap-4 items-center";

      // Add first player
      if (tournamentData.players[i].alias) {
        const playerDiv = this.createPlayer(
          tournamentData.players[i].alias!,
          tournamentData.players[i].color!,
          tournamentData.players[i].colormap!,
          tournamentData.players[i].avatar!,
          tournamentData.players[i].userId!,
        );
        gameRow.appendChild(playerDiv);
      }

      // Add second player
      if (tournamentData.players[i + 1]?.alias) {
        const vsTitle = document.createElement("h1");
        vsTitle.className = "text-white text-xl";
        vsTitle.innerText = "vs";
        gameRow.appendChild(vsTitle);
        const playerDiv = this.createPlayer(
          tournamentData.players[i + 1].alias!,
          tournamentData.players[i + 1].color!,
          tournamentData.players[i + 1].colormap!,
          tournamentData.players[i + 1].avatar!,
          tournamentData.players[i + 1].userId!,
        );
        gameRow.appendChild(playerDiv);
      }

      this.tournamentStatsDiv.appendChild(gameRow);
    }
  }

  private hideBracket() {
    if (this.main.contains(this.tournamentStatsDiv))
      this.main.removeChild(this.tournamentStatsDiv);
  }

  public async wsGameEndedHandler(
    payload: WsServerBroadcast["game_ended"],
  ): Promise<void> {
    super.wsGameEndedHandler(payload);
    const response = await this.backend.getTournamentById(this.tournamentId);
    console.log("tournament end data: ", response);
  }

  // created a player div for bracket to use
  private createPlayer(
    alias: string,
    color: string,
    colormap: string[],
    avatar: string | undefined,
    userId: string,
  ): HTMLDivElement {
    const contact = document.createElement("div");
    contact.className =
      "flex flex-row gap-4 box standard-dialog w-32 items-center";
    const contactName = document.createElement("h1");
    contactName.textContent = alias;
    const contactAvatar = new ProfileAvatar(
      color,
      colormap,
      30,
      30,
      2,
      avatar ? "image" : undefined,
      userId,
    ).getElement();
    contact.appendChild(contactAvatar);
    contact.appendChild(contactName);
    return contact;
  }

  // custom cleanup backend in tournament page for leaving a tournament
  protected cleanupBackend(): void {
    if (!this.gameState) {
      this.backend.leaveTournament();
    } else if (this.gameState.status !== GameStatus.GAME_OVER) {
      this.ws.messageGameLeave(this.gameId);
    }
  }
}
