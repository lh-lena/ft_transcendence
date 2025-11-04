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
  private isCheckingAuth: boolean = false;

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
  }

  public async mount(parent: HTMLElement): Promise<void> {
    //show loading
    this.showLoading();
    parent.appendChild(this.main);

    try {
      const isAuth = await this.checkAuth();

      if (isAuth) {
        this.router.navigate("/chat");
      } else {
        this.unAuthMenu();
      }
    } catch (err) {
      console.error("Error checking auth status:", err);
      this.unAuthMenu();
    }
  }

  private async checkAuth(): Promise<boolean> {
    if (this.isCheckingAuth) return true;

    this.isCheckingAuth = true;

    try {
      const response = await this.backend.checkAuth();

      if (response) return true;
      return false;
    } catch {
      return false;
    }
  }

  private showLoading(): void {
    const existingMenu = this.main.querySelector(".menu-container");
    if (existingMenu) {
      existingMenu.remove();
    }

    const loader = document.createElement("div");
    loader.className = "loading-spinner";
    loader.innerHTML = `
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    `;
    this.main.appendChild(loader);
  }

  private unAuthMenu(): void {
    const loader = this.main.querySelector(".loading-spinner");
    if (loader) {
      loader.remove();
    }

    const notLoggedInMenu = [
      { name: "log in", link: "/login" },
      { name: "register", link: "/register" },
      { name: "guest", link: "/tournament-game" },
    ];

    this.menu = new Menu(this.router, notLoggedInMenu);
    this.menu.mount(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
