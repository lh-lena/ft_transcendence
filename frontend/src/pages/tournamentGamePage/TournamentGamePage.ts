// services
import { ServiceContainer } from "../../services";

// mother page
import { GamePage } from "../gamePage";

// components
import { Menu, MenuItem } from "../../components/menu";
import { ProfileAvatar } from "../../components/profileAvatar";

// web socket import for notitification handler
import { WsServerBroadcast } from "../../types/websocket";

// types
import { TournamentData } from "../../types/tournament";
import { GameStatus, GameState, User } from "../../types";

// functions
import { profilePrintToArray } from "../../utils/profilePrintFunctions";
import { showError } from "../../components/toast";

export class TournamentGamePage extends GamePage {
  // game mode specific data
  private tournamentId!: string;

  // dom (UI) elements
  private tournamentStatsDiv!: HTMLDivElement;

  // private boundBeforeUnloadHandler: (e: BeforeUnloadEvent) => void;

  constructor(serviceContainer: ServiceContainer) {
    super(serviceContainer);

    this.initializeTournament();
  }

  // custom game ready for tournament
  public async wsGameReadyHandler(
    payload: WsServerBroadcast["game_ready"],
  ): Promise<void> {
    // call to base class
    super.wsGameReadyHandler(payload);
    // this is where we set game id and start game shit
    this.gameId = payload.gameId;

    console.log("game ready: ", this.gameId);

    // same ol initialize backend
    this.initializeBackend();
  }

  public async initializeBackend(): Promise<void> {
    // await this.backend.joinGame(this.gameId);
    // usually poll for game ready but in tournament we are calling it from the game ready handler
    this.intializeGameState();
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
    console.log("intialize game state");
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
    return this.gameState;
  }

  public async initializeTournament(): Promise<void> {
    // two diff kinds of calls for join tournament depending on user type
    // for registered we need to still patch the alias so extra arg
    const response = await this.backend.joinTournament();
    this.tournamentId = response.data.tournamentId;
    console.log(this.tournamentId);
    // Axios responses contain the server payload under `data`

    // show initial bracket
    this.showBracket(response.data);
  }

  public async wsNotificationHandler(
    _payload: WsServerBroadcast["notification"],
  ) {
    if (_payload.message === "INFO: New player joined the tournament") {
      setTimeout(
        async () =>
          this.showBracket(
            (await this.backend.getTournamentById(this.tournamentId)).data,
          ),
        500,
      );
    } else if (_payload.message === "INFO: Player left the tournament") {
      setTimeout(
        async () =>
          this.showBracket(
            (await this.backend.getTournamentById(this.tournamentId)).data,
          ),
        500,
      );
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
        player.username = user.username;
      }),
    );

    console.log("tournament data: ", tournamentData.players.length);

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

      // // blinking effect for our row
      // const myUsername = this.backend.getUser().username;
      // if (
      //   tournamentData.players[i].username === myUsername ||
      //   tournamentData.players[i + 1].username === myUsername
      // ) {
      //   gameRow.classList.add("animate-pulse");
      // }

      // Add first player
      if (tournamentData.players[i]) {
        const playerDiv = this.createPlayer(
          tournamentData.players[i].alias ??
            tournamentData.players[i].username!,
          tournamentData.players[i].color!,
          tournamentData.players[i].colormap!,
          tournamentData.players[i].avatar!,
          tournamentData.players[i].userId!,
        );
        gameRow.appendChild(playerDiv);
      }

      // Add second player
      if (tournamentData.players[i + 1]) {
        const vsTitle = document.createElement("h1");
        vsTitle.className = "text-white text-xl";
        vsTitle.innerText = "vs";
        gameRow.appendChild(vsTitle);
        const playerDiv = this.createPlayer(
          tournamentData.players[i + 1].alias ??
            tournamentData.players[i + 1].username!,
          tournamentData.players[i + 1].color!,
          tournamentData.players[i + 1].colormap!,
          tournamentData.players[i + 1].avatar!,
          tournamentData.players[i + 1].userId!,
        );
        gameRow.appendChild(playerDiv);
      }

      this.tournamentStatsDiv.appendChild(gameRow);
    }

    if (
      (tournamentData.round === 1 && tournamentData.players.length === 4) ||
      (tournamentData.round === 2 && tournamentData.players.length === 2)
    ) {
      const playButton = document.createElement("h1");
      playButton.innerText = "play";
      playButton.className = "btn w-32 mx-auto";
      playButton.onclick = () => {
        this.ws.messageClientReady(this.gameId);
        this.hideBracket();
        this.showLoadingOverlay("waiting");
      };
      this.tournamentStatsDiv.appendChild(playButton);
    }

    // SET GAME ID
    // just makes sure we have the correct game id in round 2 -> game id is usually set by gameReady but sometimes that doesnt work
    console.log("tournamentData: ", tournamentData);
    // extract game id from games in tournament data for round 1
    if (tournamentData.round === 1 && tournamentData.players.length === 4) {
      const myGame = tournamentData.games.find((game: any) =>
        game.players?.some(
          (player: any) => player.userId === this.backend.getUser().userId,
        ),
      );

      if (myGame) {
        this.gameId = myGame.gameId;
        console.log("Set gameId from tournament data (round 1):", this.gameId);
      }
    }
    // extract game id from games in tournament data for round 2
    if (tournamentData.round === 2 && tournamentData.players.length === 2) {
      this.gameId = tournamentData.games[0].gameId;
      console.log("Set gameId from tournament data:", this.gameId);
    }
  }

  private hideBracket() {
    if (this.main.contains(this.tournamentStatsDiv))
      this.main.removeChild(this.tournamentStatsDiv);
  }

  // need to rewrite this here because it is referinging a custom function here in tournament page
  public async showEndGameOverlay(winningUser: User): Promise<void> {
    console.log("this end game overlay");
    this.game?.hideGamePieces();
    this.scoreBar.clear();
    if (this.gameContainer && !this.menuPauseDiv) {
      this.menuEndDiv = document.createElement("div");
      this.menuEndDiv.className = "flex flex-col gap-5 items-center";
      // Create and mount menu to game container instead of main element
      console.log(
        "this end: ",
        winningUser.userId,
        this.backend.getUser().userId,
      );
      let avatar = new ProfileAvatar(
        winningUser.color,
        winningUser.colormap,
        40,
        40,
        2,
        winningUser.avatar ? "image" : undefined,
        winningUser.userId,
      );
      this.menuEndDiv.appendChild(avatar.getElement());
      this.endResultText = document.createElement("h1");
      this.endResultText.textContent = `${winningUser.username} wins`;
      this.endResultText.className = "text-white text text-center";
      this.menuEndDiv.appendChild(this.endResultText);
      this.gameContainer.appendChild(this.menuEndDiv);
      // Add overlay styling to menu element
      this.menuEndDiv.style.position = "absolute";
      this.menuEndDiv.style.top = "50%";
      this.menuEndDiv.style.left = "50%";
      this.menuEndDiv.style.transform = "translate(-50%, -50%)";
      this.menuEndDiv.style.zIndex = "1000";
    }

    // case loser from tournament round 1
    if (winningUser.userId !== this.backend.getUser().userId) {
      const menuItems: MenuItem[] = [{ name: "back", link: "/chat" }];
      const menuEnd = new Menu(this.router, menuItems);
      menuEnd.mount(this.menuEndDiv);
      return;
    }

    const waitingForRoundText = document.createElement("h1");
    waitingForRoundText.innerText = "waiting for tournament results";
    waitingForRoundText.className = "text-white text text-center";
    this.menuEndDiv.appendChild(waitingForRoundText);

    // case winner
    // wait for round 2
    const tournamentData = await this.pollForRoundStatus();

    // tournament ended (502 error)
    if (!tournamentData) {
      this.menuEndDiv.removeChild(waitingForRoundText);
      const finalWinnerText = document.createElement("h1");
      finalWinnerText.innerText = "you won the tournament!";
      finalWinnerText.className = "text-white text text-center";
      this.menuEndDiv.appendChild(finalWinnerText);

      const menuItems: MenuItem[] = [{ name: "back", link: "/chat" }];
      const menuEnd = new Menu(this.router, menuItems);
      menuEnd.mount(this.menuEndDiv);
      return;
    }

    // case winning
    const menuItems = [
      {
        name: "next round",
        onClick: () => this.nextRoundHandler(tournamentData),
      },
    ];
    const menuEnd = new Menu(this.router, menuItems);
    menuEnd.mount(this.menuEndDiv);

    this.menuEndDiv.removeChild(waitingForRoundText);
  }

  private async pollForRoundStatus(): Promise<TournamentData | null> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const response = await this.backend.getTournamentById(
            this.tournamentId,
          );

          // Check if we got a 502 in the response
          if (!response) {
            clearInterval(checkInterval);
            resolve(null);
            return;
          }

          const tournamentData: TournamentData = response.data;

          if (tournamentData.round === 2) {
            clearInterval(checkInterval);
            resolve(tournamentData);
          }
        } catch (error: any) {
          console.log("Caught error, continuing polling", error);
          // For any error, continue polling
        }
      }, 2000); // check every 2 seconds
    });
  }

  private async nextRoundHandler(tournamentData: TournamentData) {
    this.hideGame();
    this.scoreBar.unmount();

    // case second round
    this.showBracket(tournamentData);
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

  public unmount(): void {
    // stop game loop first
    if (this.game) {
      this.game.unmount();
    }

    // if we are still in the waiting screen for example
    if (!this.gameId) this.backend.leaveTournament();
    else if (this.gameState.status === GameStatus.GAME_OVER)
      this.backend.leaveTournament();
    // if we are playing the game
    else if (this.gameState.status === GameStatus.PLAYING) {
      console.log("sending game leave for game id: ", this.gameId);
      this.ws.messageGameLeave(this.gameId);
      this.ws.close();
    }

    // remove game id from local storage
    localStorage.removeItem("gameId");

    this.cleanupWebsocketHandlers();

    if (this.main) this.main.remove();
  }
}
