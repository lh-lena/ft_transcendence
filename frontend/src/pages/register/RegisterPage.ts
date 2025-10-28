import { ServiceContainer, Router, Backend } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { UserRegistration } from "../../types";
import {
  generateProfilePrint,
  profilePrintToString,
} from "../../utils/profilePrintFunctions";
import { /*showError,*/ showInfo } from "../../components/toast";

// using for dev
const uuid = crypto.randomUUID().split("-")[0]; // First segment of UUID
const demoUsername = uuid.slice(0, 6);
const demoPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

export class RegisterPage {
  private main: HTMLElement;
  private firstMenu: Menu;
  private registerMenu!: Menu;
  private pongButton: PongButton;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private backend: Backend;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    // this.auth = this.serviceContainer.get<Auth>("auth");
    this.backend = this.serviceContainer.get<Backend>("backend");

    this.main = document.createElement("div");
    this.main.className =
      "flex flex-col w-full min-h-full gap-5 justify-center text-xl items-center bg-[#0400FF]";

    this.pongButton = new PongButton();
    this.pongButton.mount(this.main);

    const firstMenu = [
      {
        name: "username",
        onClick: () => this.toggleRegisterMenu(),
      },
      // {
      //   name: "github auth",
      //   onClick: () => this.toggleoAuth2Menu(),
      // },
    ];
    this.firstMenu = new Menu(this.router, firstMenu);
    this.main.appendChild(this.firstMenu.getMenuElement());
  }

  // private async toggleoAuth2Menu() {
  //   try {
  //     const response = await this.backend.oAuth2Login();

  //     // console.log(response);

  //     if (response.type === "2FA_REQUIRED") {
  //       this.main.removeChild(this.firstMenu.getMenuElement());

  //       this.check2FA(response.userId, response.sessionId);
  //       return;
  //     }

  //     if (response.type === "OAUTH_SUCCESS") {
  //       localStorage.setItem("jwt", response.data.jwt);
  //       // console.log("OAuth successful, fetching user data...", response);
  //       const ret = await this.backend.fetchUserById(response.userId);
  //       // console.log("Fetched user data:", ret);
  //       this.backend.setUser(ret.data);
  //       this.router.navigate("/chat");
  //       return;
  //     }

  //     if (response.type === "OAUTH_ERROR") {
  //       console.error("OAuth failed:", response.error);
  //       return;
  //     }
  //   } catch (error) {
  //     console.error("OAuth process failed:", error);
  //   }
  // }

  private async registerHook() {
    // get all input data from forms
    const username = (
      document.getElementById("text_username") as HTMLInputElement
    ).value;
    const password = (
      document.getElementById("text_password") as HTMLInputElement
    ).value;
    const passwordConfirm = (
      document.getElementById("text_password_confirm") as HTMLInputElement
    ).value;

    // basic validation -> add more
    if (username.length > 6) {
      showInfo("username must be smaller than 6 characters");
      return;
    }
    if (password != passwordConfirm) {
      showInfo("passwords don't match!");
      return;
    }
    if (!password.length) {
      showInfo("please enter a password");
      return;
    }

    // generate color and color map
    const { color, colorMap } = generateProfilePrint();

    const userRegistrationData: UserRegistration = {
      username: username,
      password: password, // You might want to hash this on the backend
      tfaEnabled: "false", // Default values for now
      twofa_secret: "",
      color: color, // Default or get from form
      colormap: profilePrintToString(colorMap), // Default or get from form
    };

    await this.backend.registerUser(userRegistrationData);
    // if user object was received
    this.router.navigate("/chat");
  }

  private toggleRegisterMenu(): void {
    this.main.removeChild(this.firstMenu.getMenuElement());

    const form = document.createElement("form");
    form.className = "flex flex-col gap-3 w-48";
    this.main.appendChild(form);

    // name input
    const inputName = document.createElement("input");
    inputName.type = "text";
    inputName.id = "text_username";
    inputName.placeholder = "username";
    // dev
    inputName.value = demoUsername;
    inputName.style.paddingLeft = "0.5em"; // Add left padding
    form.appendChild(inputName);

    // password input
    const inputPassword = document.createElement("input");
    inputPassword.type = "password";
    inputPassword.id = "text_password";
    inputPassword.placeholder = "password";
    inputPassword.value = demoPassword;
    inputPassword.style.paddingLeft = "0.5em"; // Add left padding
    form.appendChild(inputPassword);

    // password input
    const inputPasswordConfirm = document.createElement("input");
    inputPasswordConfirm.type = "password";
    inputPasswordConfirm.id = "text_password_confirm";
    inputPasswordConfirm.placeholder = "confirm password";
    inputPasswordConfirm.value = demoPassword;
    inputPasswordConfirm.style.paddingLeft = "0.5em"; // Add left padding
    form.appendChild(inputPasswordConfirm);

    const loginMenu = [
      {
        name: "register",
        onClick: () => this.registerHook(),
      },
    ];
    this.registerMenu = new Menu(this.router, loginMenu);
    this.registerMenu.mount(this.main);
  }

  //private check2FA(userId: string, sessionId: string): void {
  //  // check to see if user has 2FA enabled

  //  // form
  //  const form = document.createElement("form");
  //  form.className = "flex flex-col gap-3 w-48";
  //  this.main.appendChild(form);

  //  // code input
  //  const inputCode = document.createElement("input");
  //  inputCode.type = "code";
  //  inputCode.id = "text_code";
  //  inputCode.placeholder = "code";
  //  inputCode.style.paddingLeft = "0.5em";
  //  form.appendChild(inputCode);

  //  const verificationButton = document.createElement("button");
  //  verificationButton.className = "btn w-36 mx-auto mt-4";
  //  verificationButton.onclick = (e) => {
  //    e.preventDefault();
  //    const code = inputCode.value;
  //    this.verify2FACode(userId, code, sessionId);
  //  };
  //  verificationButton.innerText = "verify";
  //  form.appendChild(verificationButton);
  //}

  //private async verify2FACode(userId: string, code: string, sessionId: string) {
  //  // Validate 2FA code format
  //  if (!code) {
  //    showInfo("please provide a 2FA code");
  //    return;
  //  }
  //  if (code.length != 6 && code.length != 16) {
  //    showInfo("please provide a valid 2fa code");
  //    return;
  //  }

  //  // default
  //  let response;

  //  // CASE CODE LENGTH > 6 -> means recovery code
  //  if (code.length == 6) {
  //    response = await this.backend.verify2FARegCode(userId, sessionId, code);
  //  } else if (code.length == 16) {
  //    response = await this.backend.verify2FARecoveryCode(
  //      userId,
  //      sessionId,
  //      code,
  //    );
  //  }

  //  if (response && response.status === 200) {
  //    localStorage.setItem("jwt", response.data.jwt);
  //    this.router.navigate("/chat");
  //  } else showError("incorrect 2fa token");
  //}

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
