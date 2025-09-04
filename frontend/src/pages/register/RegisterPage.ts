import { ServiceContainer, Router, Backend } from "../../services";
import { Menu } from "../../components/menu";
import { PongButton } from "../../components/pongButton";
import { UserRegistration } from "../../types";

export class RegisterPage {
  private main: HTMLElement;
  private menu: Menu;
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
    this.menu = new Menu(this.router, loginMenu);
    this.menu.mount(this.main);
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

    // basic validation
    if (password != passwordConfirm) {
      alert("Passwords don't match!");
      return;
    }

    const userRegistrationData: UserRegistration = {
      email: email,
      username: username,
      password_hash: password, // You might want to hash this on the backend
      is_2fa_enabled: false, // Default values for now
      twofa_secret: "",
      guest: false,
      color: "blue", // Default or get from form
      colormap: "default", // Default or get from form
      avatar: "", // Default or get from form
    };

    try {
      const response = this.backend.registerUser(userRegistrationData);
      console.log(response);
    } catch (error) {
      console.error(error);
      alert(`Registration failed: ${error}`);
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
