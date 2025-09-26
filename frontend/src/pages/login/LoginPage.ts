import { ServiceContainer, Router, Backend, Websocket } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { UserLogin } from "../../types";
import validator from "validator";

export class LoginPage {
  private main: HTMLElement;
  private firstMenu: Menu;
  private loginMenu!: Menu;
  private pongButton: PongButton;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private loginForm!: HTMLElement;
  private backend: Backend;
  private websocket: Websocket;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");
    this.websocket = this.serviceContainer.get<Websocket>("websocket");

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
        name: "github auth",
        onClick: () => this.toggleoAuth2Menu(),
      },
    ];
    this.firstMenu = new Menu(this.router, firstMenu);
    this.firstMenu.mount(this.main);
  }

  //TODO check implementation and whats still needed
  private async toggleoAuth2Menu() {
    try {
      const response = await this.backend.oAuth2Login();

      console.log(response);

      if (response.type === "2FA_REQUIRED") {
        //TODO added this here to remove login items on 2FA
        this.main.removeChild(this.firstMenu.getMenuElement());

        this.check2FA(response.userId, response.sessionId);
        return;
      }

      if (response.type === "OAUTH_SUCCESS") {
        console.log("OAuth successful, fetching user data...", response);
        const ret = await this.backend.fetchUserById(response.userId);
        console.log("Fetched user data:", ret);
        this.backend.setUser(ret.data);

        this.websocket.initializeWebSocket();
        this.backend.handleWsConnect();

        this.router.navigate("/chat");
        return;
      }

      if (response.type === "OAUTH_ERROR") {
        console.error("OAuth failed:", response.error);
        // TODO handle error
        return;
      }
    } catch (error) {
      console.error("OAuth process failed:", error);
    }
  }
  //private async toggleoAuth2Menu() {
  //  await this.backend.oAuth2Login();

  //  this.websocket.initializeWebSocket();
  //  this.router.navigate("/chat");
  //}

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

  private async attemptLogin() {
    const emailInput = document.getElementById(
      "text_email",
    ) as HTMLInputElement;
    const passwordInput = document.getElementById(
      "text_password",
    ) as HTMLInputElement;

    const email = emailInput?.value;
    const password = passwordInput?.value;

    // Basic validation
    if (!email) {
      alert("please provide an email");
      return;
    }
    if (!validator.isEmail(email)) {
      alert("please provide a valid email");
      return;
    }
    if (!password) {
      alert("please provide a password");
      return;
    }

    const userLoginData: UserLogin = {
      email: email,
      password: password,
    };

    const response = await this.backend.loginUser(userLoginData);

    if (response?.data.status === "2FA_REQUIRED") {
      //TODO check i moved this here so i dont conflict with github 2FA_Check :)
      // get rid of
      this.loginMenu.unmount();
      this.loginForm.remove();

      this.check2FA(response.data.userId, response.data.sessionId);
      return;
    }
    // this should only happen if we get the user (but i think try catch interceptor handles this)
    // TODO CONNECT TO WEB SOCKET HERE
    this.websocket.initializeWebSocket();
    this.backend.handleWsConnect();
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
    console.log(code);

    // Validate 2FA code format
    if (!code) {
      alert("Please provide a 2FA code");
      return;
    }

    // CASE CODE LENGTH > 6 -> means recovery code

    if (!validator.isNumeric(code) || code.length !== 6) {
      alert("2FA code must be 6 digits");
      return;
    }

    const response = await this.backend.verify2FARegCode(
      userId,
      sessionId,
      code,
    );
    if (response.status === 200) {
      // TODO connect to web socket here
      this.websocket.initializeWebSocket();
      this.backend.handleWsConnect();
      this.router.navigate("/chat");
    } else alert("incorrect 2fa token");
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
