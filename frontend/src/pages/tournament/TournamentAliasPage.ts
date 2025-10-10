import { ServiceContainer, Router, Backend } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { userStore } from "../../constants/backend";
import { ProfileAvatar } from "../../components/profileAvatar";
import { showInfo } from "../../components/toast";
import { TournamentData } from "../../types/tournament";

export class TournamentAliasPage {
  private main: HTMLElement;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private backend: Backend;
  private form: HTMLElement;
  private pongButton: PongButton;
  private menu: Menu;
  private inputAlias: HTMLInputElement;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");

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
    const response = await this.backend.joinTournament(alias);
    this.showBracket(response.data);
  }

  private async showBracket(tournamentData: TournamentData) {
    console.log(tournamentData);
    for (const player of tournamentData.players) {
      const user = await this.backend.getUserById(player.userId);
      player.username = user.username;
    }
    // hide other stuff
    this.form.remove();
    this.pongButton.unmount();
    this.menu.unmount();

    const bracketCol = document.createElement("div");
    bracketCol.className = "flex flex-col gap-10";
    this.main.appendChild(bracketCol);
    const bracketTitle = document.createElement("h1");
    bracketTitle.textContent = "match-ups:";
    bracketTitle.className = "text-white text-center";
    bracketCol.appendChild(bracketTitle);

    const bracketsRow = document.createElement("div");
    bracketsRow.className = "flex flex-row gap-20";
    bracketCol.appendChild(bracketsRow);
    const bracket = document.createElement("div");
    bracket.className = "flex flex-col gap-2 w-48";
    bracketsRow.appendChild(bracket);
    tournamentData.players.forEach((player, index) => {
      if (index === 1) {
        const vsText = document.createElement("p");
        vsText.textContent = "|";
        vsText.className = "text-white text-center";
        bracket.appendChild(vsText);
      }
      if (player.username) {
        const playerDiv = this.createPlayer(player.username);
        bracket.appendChild(playerDiv);
      }
      if (index === 0) bracket.classList.add("animate-pulse");
    });
    // replace with check to see if player is you (reference check)

    // setTimeout(() => this.router.navigate("/vs-player"), 5000);
  }

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

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
