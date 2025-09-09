import { ServiceContainer, Router } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";

export class LoginPage {
  private main: HTMLElement;
  private firstMenu: Menu;
  private loginMenu!: Menu;
  private pongButton: PongButton;
  private serviceContainer: ServiceContainer;
  private router: Router;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");

    this.main = document.createElement("div");
    this.main.className =
      "flex flex-col w-full min-h-full gap-5 justify-center text-xl items-center bg-[#0400FF]";

    this.pongButton = new PongButton();
    this.pongButton.mount(this.main);

    const firstMenu = [
      {
        name: "email",
        onClick: () => this.toggleLoginMenu(),
      },
      {
        name: "google auth",
        // onClick: () => this.//;
      },
    ];
    this.firstMenu = new Menu(this.router, firstMenu);
    this.firstMenu.mount(this.main);
  }

  private toggleLoginMenu(): void {
    this.main.removeChild(this.firstMenu.getMenuElement());

    // form
    const form = document.createElement("form");
    form.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(form);

    // email input
    const inputEmail = document.createElement("input");
    inputEmail.type = "email";
    inputEmail.id = "text_email";
    inputEmail.placeholder = "email";
    inputEmail.style.paddingLeft = "0.5em";
    form.appendChild(inputEmail);

    // password input
    const inputPassword = document.createElement("input");
    inputPassword.type = "password";
    inputPassword.id = "text_password";
    inputPassword.placeholder = "password";
    inputPassword.style.paddingLeft = "0.5em";
    form.appendChild(inputPassword);

    const loginMenu = [{ name: "log in", link: "/chat" }];
    this.loginMenu = new Menu(this.router, loginMenu);
    this.main.appendChild(this.loginMenu.getMenuElement());
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
