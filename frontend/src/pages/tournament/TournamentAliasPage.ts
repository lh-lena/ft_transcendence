import { ServiceContainer, Router } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";

export class TournamentAliasPage {
  private main: HTMLElement;
  private serviceContainer: ServiceContainer;
  private router: Router;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");

    this.main = document.createElement("div");
    this.main.className =
      "flex flex-col gap-5 text-xl w-full min-h-full justify-center items-center bg-[#0400FF]";

    const pongButton = new PongButton();
    pongButton.mount(this.main);

    const form = document.createElement("form");
    form.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(form);

    // email input
    const inputAlias = document.createElement("input");
    inputAlias.type = "alias";
    inputAlias.id = "text_alias";
    inputAlias.placeholder = "alias";
    inputAlias.style.paddingLeft = "0.5em";
    form.appendChild(inputAlias);

    const aliasMenu = [{ name: "play", link: "/tournament-game" }];
    const menu = new Menu(this.router, aliasMenu);
    this.main.appendChild(menu.menuElement);
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
