import { ServiceContainer, Router, Backend } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { UserRegistration } from "../../types";
import {
  generateProfilePrint,
  profilePrintToString,
} from "../../utils/profilePrintFunctions";

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
        name: "email",
        onClick: () => this.toggleRegisterMenu(),
      },
      {
        name: "google auth",
        // onClick: () => //,
      },
    ];
    this.firstMenu = new Menu(this.router, firstMenu);
    this.main.appendChild(this.firstMenu.getMenuElement());
  }

  private async registerHook() {
    // get all input data from forms
    const username = (
      document.getElementById("text_username") as HTMLInputElement
    ).value;
    const email = (document.getElementById("text_email") as HTMLInputElement)
      .value;
    const password = (
      document.getElementById("text_password") as HTMLInputElement
    ).value;
    const passwordConfirm = (
      document.getElementById("text_password_confirm") as HTMLInputElement
    ).value;

    // basic validation -> add more
    if (password != passwordConfirm) {
      alert("Passwords don't match!");
      return;
    }

    // generate color and color map
    const { color, colorMap } = generateProfilePrint();

    const userRegistrationData: UserRegistration = {
      email: email,
      username: username,
      password: password, // You might want to hash this on the backend
      tfaEnabled: "false", // Default values for now
      twofa_secret: "",
      color: color, // Default or get from form
      colormap: profilePrintToString(colorMap), // Default or get from form
    };

    try {
      const response = await this.backend.registerUser(userRegistrationData);
      // if user object was received
      if (response.status === 200) {
        // fetch user obj with user it and jwt
        this.router.navigate("/chat");
      }
    } catch (error) {
      console.error(error);
      alert(`Registration failed: ${error}`);
    }
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
    inputName.style.paddingLeft = "0.5em"; // Add left padding
    form.appendChild(inputName);

    // email input
    const inputEmail = document.createElement("input");
    inputEmail.type = "email";
    inputEmail.id = "text_email";
    inputEmail.placeholder = "email";
    inputEmail.style.paddingLeft = "0.5em"; // Add left padding
    form.appendChild(inputEmail);

    // password input
    const inputPassword = document.createElement("input");
    inputPassword.type = "password";
    inputPassword.id = "text_password";
    inputPassword.placeholder = "password";
    inputPassword.style.paddingLeft = "0.5em"; // Add left padding
    form.appendChild(inputPassword);

    // password input
    const inputPasswordConfirm = document.createElement("input");
    inputPasswordConfirm.type = "password";
    inputPasswordConfirm.id = "text_password_confirm";
    inputPasswordConfirm.placeholder = "confirm password";
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

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
