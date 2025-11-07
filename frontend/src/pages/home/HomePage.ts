import { Menu } from "../../components/menu";
import { ServiceContainer, Router } from "../../services";
import { PongButton } from "../../components/pongButton";
import { Backend } from "../../services/Backend";

export class HomePage {
  private main: HTMLElement;
  private menu: Menu | null;
  private pongButton: PongButton;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private backend: Backend;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");

    // DON'T call checkIfLoggedIn here - it causes infinite loop

    this.main = document.createElement("div");
    this.main.className =
      "flex flex-col gap-5 w-full min-h-full justify-center items-center bg-[#0400FF]";

    this.menu = null;

    this.pongButton = new PongButton();
    this.pongButton.mount(this.main);

    this.buildMenu();
  }

  public async mount(parent: HTMLElement): Promise<void> {
    //show loading
    // this.pongButton.setLoading();
    parent.appendChild(this.main);

    try {
      const isAuth = await this.checkAuth();

      if (isAuth) {
        this.router.navigate("/chat");
      }
    } catch (error) {
      console.log(error);
    }
  }

  private async checkAuth(): Promise<boolean> {
    try {
      const response = await this.backend.checkAuth();

      if (response && response.role !== "guest") return true;
      return false;
    } catch {
      // catch any error
      return false;
    }
  }

  private buildMenu(): void {
    this.pongButton.unsetLoading();

    const notLoggedInMenu = [
      { name: "log in", link: "/login" },
      { name: "register", link: "/register" },
      { name: "guest", link: "/tournament-alias" },
    ];

    this.menu = new Menu(this.router, notLoggedInMenu);
    this.menu.mount(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
