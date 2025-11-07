// components
import { Menu } from "../../components/menu";

// services
import { Router, ServiceContainer } from "../../services";

// errors and shit
import { showError } from "../../components/toast";

export class AliasPage {
  // DOM
  private main!: HTMLElement;
  private form!: HTMLElement;
  private inputAlias!: HTMLInputElement;
  private menu!: Menu;

  // vars
  private alias!: string;

  // services
  private router!: Router;

  constructor() {
    console.log("alias page");
  }

  private showAliasForm(servicesContainer: ServiceContainer) {
    // services
    this.router = servicesContainer.get<Router>("router");
    this.backend = servicesContainer.get<Back

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

  private async handlePlayButton() {
    // grab alias
    this.alias = this.inputAlias.value.trim();

    if (this.alias.length === 0) {
      showError("must provide an alias");
      return;
    }

    try {
      const tempUserId = this.backend.getUser()?.userId;
      console.log("temp user Id: ", tempUserId);
      if (tempUserId) this.isGuest = false;
      else this.isGuest = true;
    } catch (error) {
      this.isGuest = true;
      console.log(error);
    }

    // if we have a guest we set the guest user
    if (this.isGuest) {
      const response = await this.backend.registerGuest(this.alias);
      console.log("alias guest: ", response);
      // then also initialize web socket connection for guest user
      this.ws.initializeWebSocket();
    } else {
      // patch alias for registered user
      await this.backend.patchAlias(this.alias);
    }

    this.initializeTournament();
  }

  mount(parent: HTMLElement) {
    // add dom
    parent.appendChild(this.main);
  }

  unmount() {
    // remove DOM
    this.main.remove();
  }
}
