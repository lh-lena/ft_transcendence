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
  private bracketCol!: HTMLDivElement;

  constructor(serviceContainer: ServiceContainer) {
    super(serviceContainer);

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

  public async wsGameUpdateHandler(
    payload: WsServerBroadcast["game_update"],
  ): Promise<void> {
    // runs on first game update thats sent with game_ready
    if (!this.gameId) {
      this.gameId = payload.gameId;
      console.log("set game id in inherited class");
    }
    super.wsGameUpdateHandler(payload);
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

    this.initializeBackend();
  }

  public async initializeBackend(): Promise<void> {
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
    if (
      _payload.message === "INFO: New player joined the tournament" ||
      _payload.message === "INFO: Tournament starts soon"
    ) {
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
    // Ensure all player data is populated before rendering
    await Promise.all(
      tournamentData.players.map(async (player) => {
        const user = await this.backend.getUserById(player.userId);
        player.alias = user.alias;
        player.color = user.color;
        player.colormap = profilePrintToArray(user.colormap);
      }),
    );

    console.log(tournamentData);

    // hide waiting loading thing
    this.hideLoadingOverlay();

    // reset bracket stuff make sure its empty
    if (this.bracketCol) this.bracketCol.innerHTML = "";

    this.bracketCol = document.createElement("div");
    this.bracketCol.className = "flex flex-col gap-10";
    this.main.appendChild(this.bracketCol);
    const bracketTitle = document.createElement("h1");
    bracketTitle.textContent = "match-ups:";
    bracketTitle.className = "text-white text-center";
    this.bracketCol.appendChild(bracketTitle);

    const bracketsRow = document.createElement("div");
    bracketsRow.className = "flex flex-row gap-20";
    this.bracketCol.appendChild(bracketsRow);

    tournamentData.players.forEach((player, index) => {
      // create new bracket row for every pair (even indices) or single player
      if (index % 2 === 0) {
        const bracket = document.createElement("div");
        bracket.className = "flex flex-col gap-2 w-48";
        bracketsRow.appendChild(bracket);

        // Add first player
        if (player.alias && player.color && player.colormap) {
          const playerDiv = this.createPlayer(
            player.alias,
            player.color,
            player.colormap,
          );
          bracket.appendChild(playerDiv);
        }

        // Check if there's a second player to pair with
        const nextPlayer = tournamentData.players[index + 1];
        if (nextPlayer) {
          // Add VS separator
          const vsText = document.createElement("p");
          vsText.textContent = "|";
          vsText.className = "text-white text-center";
          bracket.appendChild(vsText);

          // Add second player
          if (nextPlayer.alias && nextPlayer.color && nextPlayer.colormap) {
            const playerDiv = this.createPlayer(
              nextPlayer.alias,
              nextPlayer.color,
              nextPlayer.colormap,
            );
            bracket.appendChild(playerDiv);
          }
        }

        // Add pulse animation if current user is in this bracket
        if (
          player.userId === this.backend.getUser().userId ||
          nextPlayer?.userId === this.backend.getUser().userId
        ) {
          bracket.classList.add("animate-pulse");
        }
      }
    });
  }

  // created a player div for bracket to use
  private createPlayer(
    alias: string,
    color: string,
    colormap: string[],
  ): HTMLDivElement {
    const contact = document.createElement("div");
    contact.className =
      "flex flex-row gap-4 box standard-dialog w-full items-center";
    const contactName = document.createElement("h1");
    contactName.textContent = alias;
    const contactAvatar = new ProfileAvatar(
      color,
      colormap,
      30,
      30,
      2,
      // TODO need to allow pics to used here too
    ).getElement();
    contact.appendChild(contactAvatar);
    contact.appendChild(contactName);
    return contact;
  }
}
