import { ServiceContainer, Router, Backend } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { userStore } from "../../constants/backend";
import { ProfileAvatar } from "../../components/profileAvatar";
import { showInfo } from "../../components/toast";
import { TournamentData } from "../../types/tournament";
import { WsServerBroadcast } from "../../types/websocket";

export class TournamentAliasPage {
  private main: HTMLElement;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private backend: Backend;
  private form: HTMLElement;
  private pongButton: PongButton;
  private menu: Menu;
  private inputAlias: HTMLInputElement;
  private tournamentId!: string;
  private bracketCol!: HTMLDivElement;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");

    window.addEventListener("beforeunload", this.quitHook.bind(this));

    this.main = document.createElement("div");
    this.main.className =
      "flex flex-col gap-5 text-xl w-full min-h-full justify-center items-center bg-[#0400FF]";

    this.pongButton = new PongButton();
    this.pongButton.mount(this.main);

    this.form = document.createElement("form");
    this.form.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(this.form);

    // email input
    this.inputAlias = document.createElement("input");
    this.inputAlias.type = "text";
    this.inputAlias.id = "text_alias";
    this.inputAlias.placeholder = "alias";
    this.inputAlias.style.paddingLeft = "0.5em";
    this.form.appendChild(this.inputAlias);

    const aliasMenu = [{ name: "play", onClick: () => this.handlePlay() }];
    this.menu = new Menu(this.router, aliasMenu);
    this.main.appendChild(this.menu.getMenuElement());
  }

  private async handlePlay() {
    const alias = this.inputAlias.value.trim();
    if (!alias) {
      showInfo("please enter an alias");
      return;
    }

    // get params
    const params = this.router.getQueryParams();
    const userType = params.get("userType") ?? undefined;

    // case guest
    if (userType === "guest") {
      await this.backend.registerGuest(alias);
    }

    // once guest is a "registered user we go here" or also just for reg restirred users
    const response = await this.backend.joinTournament(alias, userType);

    this.tournamentId = response.data.tournamentId;

    // this.showBracket(response.data);
    this.router.navigate("/vs-player", {
      gameType: "tournament",
      tournamentId: this.tournamentId,
    });
  }

  // MOVE
  private async handleWsGameStart(payload: WsServerBroadcast["game_start"]) {
    this.router.navigate("/vs-player", {
      gameType: "tournament",
      gameId: payload.gameId,
      gameStartPayload: JSON.stringify(payload),
    });
  }

  // MOVE
  private async handleWsNotifications(
    payload: WsServerBroadcast["notification"],
  ) {
    // re run show bracket on notification that new player joined
    const newTournamentData = await this.backend.getTournamentById(
      this.tournamentId,
    );
    console.log(newTournamentData);
    console.log(payload);
    if (payload.message === "INFO: New Player joined the tournament")
      this.showBracket(newTournamentData.data);
  }

  // MOVE
  private async showBracket(tournamentData: TournamentData) {
    for (const player of tournamentData.players) {
      const user = await this.backend.getUserById(player.userId);
      player.alias = user.alias;
    }
    // hide other stuff
    this.form.remove();
    this.pongButton.unmount();
    this.menu.unmount();

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
        if (player.alias) {
          const playerDiv = this.createPlayer(player.alias);
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
          if (nextPlayer.alias) {
            const playerDiv = this.createPlayer(nextPlayer.alias);
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

  // MOVE
  private createPlayer(username: string): HTMLDivElement {
    const contact = document.createElement("div");
    contact.className =
      "flex flex-row gap-4 box standard-dialog w-full items-center";
    const contactName = document.createElement("h1");
    contactName.textContent = username;
    const contactAvatar = new ProfileAvatar(
      userStore.color,
      userStore.colormap,
      30,
      30,
      2,
      //TODO need these in userStore
      //userStore.avatar ? "image" : undefined,
      //userStore.userId,
    ).getElement();
    contact.appendChild(contactAvatar);
    contact.appendChild(contactName);
    return contact;
  }

  private quitHook() {
    this.backend.leaveTournament();
    this.unmount();
    this.router.navigate("/chat");
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
