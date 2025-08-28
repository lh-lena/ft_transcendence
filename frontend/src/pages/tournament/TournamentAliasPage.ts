import { ServiceContainer, Router } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { userStore } from "../../constants/backend";
import { ProfileAvatar } from "../../components/profileAvatar";

// replace with stuff from backend
const demoMatchup1 = ["alex", "naledi"];
const demoMatchup2 = ["lucas", "mo"];
const matchUps = [demoMatchup1, demoMatchup2];

export class TournamentAliasPage {
  private main: HTMLElement;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private form: HTMLElement;
  private pongButton: PongButton;
  private menu: Menu;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");

    this.main = document.createElement("div");
    this.main.className =
      "flex flex-col gap-5 text-xl w-full min-h-full justify-center items-center bg-[#0400FF]";

    this.pongButton = new PongButton();
    this.pongButton.mount(this.main);

    this.form = document.createElement("form");
    this.form.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(this.form);

    // email input
    const inputAlias = document.createElement("input");
    inputAlias.type = "text";
    inputAlias.id = "text_alias";
    inputAlias.placeholder = "alias";
    inputAlias.style.paddingLeft = "0.5em";
    this.form.appendChild(inputAlias);

    const aliasMenu = [{ name: "play", onClick: () => this.showBracket() }];
    this.menu = new Menu(this.router, aliasMenu);
    this.main.appendChild(this.menu.menuElement);
  }

  private showBracket(): void {
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
    // loop over match ups
    matchUps.forEach((matchup) => {
      const bracket = document.createElement("div");
      bracket.className = "flex flex-col gap-2 w-48";
      bracketsRow.appendChild(bracket);
      // for each matchup
      matchup.forEach((player) => {
        if (matchup.indexOf(player) == 1) {
          const vsText = document.createElement("p");
          vsText.textContent = "|";
          vsText.className = "text-white text-center";
          bracket.appendChild(vsText);
        }
        const playerDiv = this.createPlayer(player);
        bracket.appendChild(playerDiv);
        if (matchUps.indexOf(matchup) == 0)
          bracket.classList.add("animate-pulse");
      });
      // replace with check to see if player is you (reference check)
    });

    setTimeout(() => this.router.navigate("/vs-player"), 5000);
  }

  private createPlayer(username: string): HTMLDivElement {
    const contact = document.createElement("div");
    contact.className =
      "flex flex-row gap-4 box standard-dialog w-full items-center";
    const contactName = document.createElement("h1");
    contactName.textContent = username;
    const contactAvatar = new ProfileAvatar(
      userStore.color,
      userStore.colorMap,
      30,
      30,
      2,
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
