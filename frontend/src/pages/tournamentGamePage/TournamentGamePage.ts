// services
import { ServiceContainer } from "../../services";

// mother page
import { GamePage } from "../gamePage";

// components
import { Menu } from "../../components/menu";

export class TournamentGamePage extends GamePage {
  // game mode specific data
  private alias!: string;
  private tournamentId!: string;
  private isGuest: boolean;

  // dom (UI) elements
  private form!: HTMLElement;
  private inputAlias!: HTMLInputElement;
  private menu!: Menu;

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

  private async handlePlayButton() {
    // grab alias
    this.alias = this.inputAlias.value.trim();

    // hide form UI
    this.hideAliasForm();

    // show loading overlay
    this.showLoadingOverlay("waiting");

    // if we have a guest we set the guest user
    if (this.isGuest) {
      const response = await this.backend.registerGuest(this.alias);
      console.log(response);
    }

    this.initializeBackend();
  }

  public async initializeBackend(): Promise<void> {
    const response = await this.backend.joinTournament(this.alias);
    this.tournamentId = response.data.tournamentId;
    console.log(this.tournamentId);
    // Axios responses contain the server payload under `data`
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
}
