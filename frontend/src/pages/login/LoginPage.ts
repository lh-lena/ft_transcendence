import { ServiceContainer, Router, Backend } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { UserLogin } from "../../types";

export class LoginPage {
  private main: HTMLElement;
  private firstMenu: Menu;
  private loginMenu!: Menu;
  private pongButton: PongButton;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private loginForm!: HTMLElement;
  private backend: Backend;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");

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
    this.loginForm = document.createElement("form");
    this.loginForm.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(this.loginForm);

    // email input
    const inputEmail = document.createElement("input");
    inputEmail.type = "email";
    inputEmail.id = "text_email";
    inputEmail.placeholder = "email";
    inputEmail.style.paddingLeft = "0.5em";
    this.loginForm.appendChild(inputEmail);

    // password input
    const inputPassword = document.createElement("input");
    inputPassword.type = "password";
    inputPassword.id = "text_password";
    inputPassword.placeholder = "password";
    inputPassword.style.paddingLeft = "0.5em";
    this.loginForm.appendChild(inputPassword);

    const loginMenu = [
      {
        name: "log in",
        onClick: () => this.attemptLogin(),
      },
    ];
    this.loginMenu = new Menu(this.router, loginMenu);
    this.main.appendChild(this.loginMenu.getMenuElement());
  }

  private attemptLogin() {
    const emailInput = document.getElementById(
      "text_email",
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "text_password",
    ) as HTMLInputElement;

    const email = emailInput?.value;
    const password = passwordInput?.value;

    // Basic validation
    if (!email || !password) {
      console.error("Email and password are required");
      return;
    }

    const userLoginData: UserLogin = {
      email: email,
      password: password,
    };

    this.backend.loginUser(userLoginData);
    // this should only happen if we get the user (but i think try catch interceptor handles this)
    this.router.navigate("/chat");
  }

  private check2FA(): void {
    // check to see if user has 2FA enabled

    // get rid of
    this.loginMenu.unmount();
    this.loginForm.remove();

    // form
    const form = document.createElement("form");
    form.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(form);

    // email input
    const inputEmail = document.createElement("input");
    inputEmail.type = "email";
    inputEmail.id = "text_email";
    inputEmail.placeholder = "code";
    inputEmail.style.paddingLeft = "0.5em";
    form.appendChild(inputEmail);

    const verificationButton = document.createElement("button");
    verificationButton.className = "btn w-36 mx-auto mt-4";
    verificationButton.onclick = (e) => {
      e.preventDefault();
      const code = inputEmail.value;
      this.verify2FACode(code);
    };
    verificationButton.innerText = "verify";
    form.appendChild(verificationButton);
  }

  private verify2FACode(code: string): void {
    console.log(code);
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
