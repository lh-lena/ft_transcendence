import { ServiceContainer, Router, Backend } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { UserLogin } from "../../types";
import validator from "validator";
import { showError, showInfo } from "../../components/toast";

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
        name: "username",
        onClick: () => this.toggleLoginMenu(),
      },
      {
        name: "github auth",
        onClick: () => this.toggleoAuth2Menu(),
      },
    ];
    this.firstMenu = new Menu(this.router, firstMenu);
    this.firstMenu.mount(this.main);
  }

  private async toggleoAuth2Menu() {
    try {
      const response = await this.backend.oAuth2Login();

      //console.log(response);

      if (response.type === "2FA_REQUIRED") {
        this.main.removeChild(this.firstMenu.getMenuElement());

        this.check2FA(response.userId, response.sessionId);
        return;
      }

      if (response.type === "OAUTH_SUCCESS") {
        //console.log("OAuth successful, fetching user data...", response);
        const ret = await this.backend.fetchUserById(response.userId);
        //console.log("Fetched user data:", ret);
        this.backend.setUser(ret.data);
        this.router.navigate("/chat");
        return;
      }

      if (response.type === "OAUTH_ERROR") {
        console.error("OAuth failed:", response.error);
        showError("oauth error");
        return;
      }
    } catch (error) {
      console.error("OAuth process failed:", error);
    }
  }

  private toggleLoginMenu(): void {
    this.main.removeChild(this.firstMenu.getMenuElement());

    // form
    this.loginForm = document.createElement("form");
    this.loginForm.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(this.loginForm);

    // email input
    const inputUsername = document.createElement("input");
    inputUsername.type = "email";
    inputUsername.id = "text_username";
    inputUsername.placeholder = "username";
    inputUsername.style.paddingLeft = "0.5em";
    this.loginForm.appendChild(inputUsername);

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

  private async attemptLogin() {
    const usernameInput = document.getElementById(
      "text_username",
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "text_password",
    ) as HTMLInputElement;

    const username = usernameInput?.value;
    const password = passwordInput?.value;

    // Basic validation
    if (!username) {
      showError("please provide a username");
      return;
    }
    if (!password) {
      showInfo("please provide a password");
      return;
    }

    const userLoginData: UserLogin = {
      username: username,
      password: password,
    };

    const response = await this.backend.loginUser(userLoginData);

    if (response?.data.status === "2FA_REQUIRED") {
      this.loginMenu.unmount();
      this.loginForm.remove();

      this.check2FA(response.data.userId, response.data.sessionId);
      return;
    }
    this.router.navigate("/chat");
  }

  private check2FA(userId: string, sessionId: string): void {
    // check to see if user has 2FA enabled

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
      this.verify2FACode(userId, code, sessionId);
    };
    verificationButton.innerText = "verify";
    form.appendChild(verificationButton);
  }

  private async verify2FACode(userId: string, code: string, sessionId: string) {
    // Validate 2FA code format
    if (!code) {
      showInfo("please provide a 2FA code");
      return;
    }
    if (code.length != 6 && code.length != 16) {
      showInfo("please provide a valid 2fa code");
      return;
    }

    // default
    let response;

    // CASE CODE LENGTH > 6 -> means recovery code
    if (code.length == 6) {
      response = await this.backend.verify2FARegCode(userId, sessionId, code);
    } else if (code.length == 16) {
      response = await this.backend.verify2FARecoveryCode(
        userId,
        sessionId,
        code,
      );
    }

    if (response && response.status === 200) {
      localStorage.setItem("jwt", response.data.jwt);
      this.router.navigate("/chat");
    } else showError("incorrect 2fa token");
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
