import { ServiceContainer, Router, Backend } from "../../services";
import { CANVAS_DEFAULTS } from "../../types";
import { Window } from "../../components/window";
import { MenuBar } from "../../components/menuBar";
import { showError, showInfo } from "../../components/toast";

// shape of settings
interface settingItem {
  label: string;
  value: string;
  type: string;
  onClick?: () => void;
}

// type of settings array (collection of settings)
type settingList = settingItem[];

// decided to put this here for now to make it easier to migrate later
let securitySettings: settingList = [
  { label: "2FA", value: "on", type: "button" },
  {
    label: "password",
    value: "change",
    type: "button",
    // define on click in constructor
  },
  {
    label: "username",
    value: "change",
    type: "button",
    // define on click in constructor
  },
];

const profileSettings: settingList = [
  // { label: "other", value: "off" },
  { label: "avatar", value: "upload", type: "file" },
  { label: "delete", value: "X", type: "button" },
];

const settingCategories = [
  { label: "security", settingsList: securitySettings },
  { label: "profile", settingsList: profileSettings },
];

export class SettingsPage {
  private main: HTMLElement;
  private window: Window;
  private settingsPanel: HTMLDivElement;
  private buttonRow: HTMLDivElement;
  private activeButton!: HTMLElement;
  private inputPasswordDiv!: HTMLDivElement;
  private twoFAMenu!: HTMLDivElement;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private backend: Backend;
  private inputUsernameDiv!: HTMLDivElement;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");

    // fetch user from backend

    // change 2FA settings from user data
    const twoFASetting = securitySettings.find((s) => s.label === "2FA");
    if (twoFASetting)
      twoFASetting.value = this.backend.getUser().tfaEnabled ? "on" : "off";

    // Full page background
    this.main = document.createElement("div");
    this.main.className =
      "w-full min-h-screen flex items-center justify-center bg-brandBlue";

    // Window content
    this.buttonRow = document.createElement("div");
    this.buttonRow.className = "flex flex-row gap-3";

    settingCategories.forEach((item, idx) => {
      const button = document.createElement("button");
      button.className = "btn flex items-center justify-center w-24";
      if (idx === 0) {
        button.classList.add("btn-default");
        this.activeButton = button;
      }
      button.textContent = item.label;
      button.onclick = () => this.toggleButton(button, item.settingsList);
      this.buttonRow.appendChild(button);
    });

    const menuBar = new MenuBar(serviceContainer, "settings");

    // settings main
    this.settingsPanel = document.createElement("div");
    this.settingsPanel.className = "flex flex-col w-64 gap-2";

    // ON CLICKS link functions to settings
    // needed this object to link functions
    // using optional chaining (!) because we are sure it exists other wise we would write more defensively
    securitySettings.find((setting) => setting.label === "password")!.onClick =
      () => this.changePassword();
    securitySettings.find((setting) => setting.label === "username")!.onClick =
      () => this.changeUsername();
    securitySettings.find((setting) => setting.label === "2FA")!.onClick = () =>
      this.toggle2FASettings();
    profileSettings.find((setting) => setting.label === "delete")!.onClick =
      () => this.deleteAccount();

    // use security settings as default for page
    this.populateSettingsPanel(securitySettings);

    this.window = new Window({
      title: "settings",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBar.render(), this.buttonRow, this.settingsPanel],
    });

    this.main.appendChild(this.window.getElement());
  }

  private deleteAccount() {
    this.backend.deleteAcc();
    this.router.navigate("/");
  }

  private toggleButton(button: HTMLElement, settingsList: settingList): void {
    this.changeActiveCategoryButton(button);
    const newSettingsPanel = document.createElement("div");
    newSettingsPanel.className = this.settingsPanel.className;
    this.settingsPanel.parentNode?.replaceChild(
      newSettingsPanel,
      this.settingsPanel,
    );
    this.settingsPanel = newSettingsPanel;
    this.populateSettingsPanel(settingsList);
  }

  private populateSettingsPanel(settingsList: settingList): void {
    settingsList.forEach((setting) => {
      const box = document.createElement("div");
      if (setting.label === "delete") {
        box.className =
          "flex flex-row gap-2 standard-dialog items-center border-black text-red-700";
      } else {
        box.className = "flex flex-row gap-2 standard-dialog items-center";
      }
      //     box.className = "flex flex-row gap-2 standard-dialog items-center";
      const boxTitle = document.createElement("h1");
      boxTitle.textContent = setting.label;
      box.appendChild(boxTitle);
      this.settingsPanel.appendChild(box);
      if (setting.type == "file") {
        // create hidden file input
        // this is the upload input form
        const boxInputFile = document.createElement("input");
        boxInputFile.type = "file";
        boxInputFile.id = `file-${setting.label}`;
        boxInputFile.className = "hidden";
        boxInputFile.accept = "image/png";
        // create styled label that looks like your buttons
        const fileLabel = document.createElement("label");
        fileLabel.htmlFor = boxInputFile.id;
        fileLabel.textContent = setting.value;
        fileLabel.className = "btn ml-auto cursor-pointer";
        box.appendChild(boxInputFile);
        box.appendChild(fileLabel);

        boxInputFile.onchange = () => {
          const file = boxInputFile.files?.[0];
          if (!file) return;

          // Check file size (e.g., 5MB max)
          const maxSizeInBytes = 10 * 1024 * 1024; // 5MB
          if (file.size > maxSizeInBytes) {
            showError("File size must be less than 5MB");
            boxInputFile.value = ""; // Clear the input
            return;
          }

          this.backend.uploadAvatar(file);
        };
      } else if (setting.type == "button") {
        const boxButton = document.createElement("button");
        boxButton.innerText = setting.value;
        boxButton.className = "btn ml-auto";
        if (setting.value == "on")
          boxButton.className =
            "btn active ml-auto bg-black text-white rounded";
        else if (setting.label === "delete")
          boxButton.className =
            "btn ml-auto text-red-700 hover:bg-red-200 rounded";
        if (setting.onClick) {
          boxButton.onclick = setting.onClick;
        }
        box.appendChild(boxButton);
      }
    });
  }

  private changeActiveCategoryButton(button: HTMLElement) {
    this.activeButton.classList.remove("btn-default");
    button.classList.add("btn-default");
    this.activeButton = button;
  }

  private changePassword(): void {
    // hide main settings
    if (this.window.getElement().contains(this.settingsPanel)) {
      this.settingsPanel.remove();
      this.buttonRow.remove();

      // new password stuff
      this.inputPasswordDiv = document.createElement("div");
      this.inputPasswordDiv.className = "flex h-full pt-4 flex-col gap-5 w-36";
      this.window.getPane().appendChild(this.inputPasswordDiv);
      const inputPasswordTitle = document.createElement("p");
      inputPasswordTitle.textContent = "new password:";
      inputPasswordTitle.className = "font-bold text-center";
      this.inputPasswordDiv.appendChild(inputPasswordTitle);
      const inputPasswordFirst = document.createElement("input");
      inputPasswordFirst.type = "password";
      inputPasswordFirst.id = "text_password";
      inputPasswordFirst.placeholder = "password";
      inputPasswordFirst.style.paddingLeft = "0.5em";
      const inputPasswordSecond = inputPasswordFirst.cloneNode(true);
      this.inputPasswordDiv.appendChild(inputPasswordFirst);
      this.inputPasswordDiv.appendChild(inputPasswordSecond);
      const inputPasswordButton = document.createElement("button");
      inputPasswordButton.className = "btn";
      inputPasswordButton.onclick = () => {
        const password1 = (inputPasswordFirst as HTMLInputElement).value;
        const password2 = (inputPasswordSecond as HTMLInputElement).value;
        if (password1 !== password2) {
          showError("Passwords do not match!");
          return;
        }
        if (password1.length < 6) {
          showInfo("Password must be at least 6 characters!");
          return;
        }
        this.sendChangePasswordHook(password1);
      };
      inputPasswordButton.innerText = "change";
      this.inputPasswordDiv.appendChild(inputPasswordButton);
    } // show
    else {
      this.inputPasswordDiv.remove();
      this.window.getPane().appendChild(this.buttonRow);
      this.window.getPane().appendChild(this.settingsPanel);
    }
  }

  private changeUsername(): void {
    // hide main settings
    if (this.window.getElement().contains(this.settingsPanel)) {
      this.settingsPanel.remove();
      this.buttonRow.remove();

      // new username stuff
      this.inputUsernameDiv = document.createElement("div");
      this.inputUsernameDiv.className = "flex h-full pt-4 flex-col gap-5 w-36";
      this.window.getPane().appendChild(this.inputUsernameDiv);
      const inputUsernameTitle = document.createElement("p");
      inputUsernameTitle.textContent = "new username:";
      inputUsernameTitle.className = "font-bold text-center";
      this.inputUsernameDiv.appendChild(inputUsernameTitle);
      const inputUsernameFirst = document.createElement("input");
      inputUsernameFirst.type = "text";
      inputUsernameFirst.id = "text_username";
      inputUsernameFirst.placeholder = "username";
      inputUsernameFirst.style.paddingLeft = "0.5em";
      this.inputUsernameDiv.appendChild(inputUsernameFirst);
      const inputUsernameButton = document.createElement("button");
      inputUsernameButton.className = "btn";
      inputUsernameButton.onclick = () => {
        const username = (inputUsernameFirst as HTMLInputElement).value;
        if (username.length === 0) {
          showInfo("username must be at least 1 character!");
          return;
        } else if (username.length > 16) {
          showInfo("username must be smaller than 17 characters!");
          return;
        }
        this.sendChangeUsernameHook(username);
      };
      inputUsernameButton.innerText = "change";
      this.inputUsernameDiv.appendChild(inputUsernameButton);
    } // show
    else {
      this.inputUsernameDiv.remove();
      this.window.getPane().appendChild(this.buttonRow);
      this.window.getPane().appendChild(this.settingsPanel);
    }
  }

  private async sendChangeUsernameHook(newUsername: string) {
    this.backend.changeUsernameById(this.backend.getUser().userId, newUsername);
    this.inputUsernameDiv.remove();
    this.window.getPane().appendChild(this.buttonRow);
    this.window.getPane().appendChild(this.settingsPanel);
  }

  private async sendChangePasswordHook(newPassword: string) {
    this.backend.changePasswordById(this.backend.getUser().userId, newPassword);
    // back to normal settings
    this.inputPasswordDiv.remove();
    this.window.getPane().appendChild(this.buttonRow);
    this.window.getPane().appendChild(this.settingsPanel);
  }

  private toggle2FASettings(): void {
    // hide main settings
    if (this.window.getElement().contains(this.settingsPanel)) {
      this.settingsPanel.remove();
      this.buttonRow.remove();
    }

    this.twoFAMenu = document.createElement("div");
    this.twoFAMenu.className = "flex h-full pt-4 flex-col gap-5 w-36";
    this.window.getPane().appendChild(this.twoFAMenu);
    const twoFATitle = document.createElement("p");
    twoFATitle.textContent = "2FA Settings:";
    twoFATitle.className = "font-bold text-center";
    this.twoFAMenu.appendChild(twoFATitle);
    // const twoFAButtonEmail = document.createElement("button");
    // twoFAButtonEmail.className = "btn";
    // twoFAButtonEmail.onclick = () => this.toggleEmail2FASettings();
    // twoFAButtonEmail.innerText = "email";
    // this.twoFAMenu.appendChild(twoFAButtonEmail);
    const twoFAButtonTOTP = document.createElement("button");
    twoFAButtonTOTP.className = "btn";
    twoFAButtonTOTP.onclick = () => this.toggleTOTP2FASettings();
    twoFAButtonTOTP.innerText = "TOTP";
    this.twoFAMenu.appendChild(twoFAButtonTOTP);
  }

  private async toggleTOTP2FASettings() {
    // let auth server know
    const response = await this.backend.twoFaTOTP(
      this.backend.getUser().userId,
    );
    // hide old 2fa settings
    this.twoFAMenu.remove();

    this.twoFAMenu = document.createElement("div");
    this.twoFAMenu.className = "flex h-full pt-4 flex-col gap-5 w-36";
    this.window.getPane().appendChild(this.twoFAMenu);
    const twoFATitle = document.createElement("p");
    twoFATitle.textContent = "TOTP 2FA:";
    twoFATitle.className = "font-bold text-center";
    this.twoFAMenu.appendChild(twoFATitle);
    // qr code
    // Generate QR code synchronously
    const qrImage = document.createElement("img");
    qrImage.className = "mx-auto w-20 h-20";
    qrImage.src = response.data.qrCodeDataUrl;
    this.twoFAMenu.appendChild(qrImage);
    // Generate QR code to canvas

    const recoveryCode2FAButton = document.createElement("button");
    recoveryCode2FAButton.className = "btn";
    recoveryCode2FAButton.onclick = () =>
      this.downloadRecoveryKeys(response.data.codes);
    recoveryCode2FAButton.innerText = "backup keys";
    this.twoFAMenu.appendChild(recoveryCode2FAButton);

    const back2FAbutton = document.createElement("button");
    back2FAbutton.className = "btn";
    back2FAbutton.onclick = () => this.clear2FAMenu();
    back2FAbutton.innerText = "back";
    this.twoFAMenu.appendChild(back2FAbutton);
  }

  private async clear2FAMenu() {
    this.twoFAMenu.remove();
    this.window.getPane().appendChild(this.buttonRow);
    this.window.getPane().appendChild(this.settingsPanel);
  }

  private async downloadRecoveryKeys(recoveryCodes: string[]) {
    const fileContent = recoveryCodes.join("\n");
    const blob = new Blob([fileContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recovery-codes.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private toggleTOTPVerifyCode(): void {
    // hide old 2fa settings
    this.twoFAMenu.remove();

    this.twoFAMenu = document.createElement("div");
    this.twoFAMenu.className = "flex h-full pt-4 flex-col gap-5 w-36";
    this.window.getPane().appendChild(this.twoFAMenu);
    const twoFATitle = document.createElement("p");
    twoFATitle.textContent = "TOTP 2FA:";
    twoFATitle.className = "font-bold text-center";
    this.twoFAMenu.appendChild(twoFATitle);
    // input email code
    const inputEmailCode = document.createElement("input");
    inputEmailCode.type = "code";
    inputEmailCode.id = "text_password";
    inputEmailCode.placeholder = "code";
    inputEmailCode.style.paddingLeft = "0.5em";
    this.twoFAMenu.appendChild(inputEmailCode);
    const email2FAButton = document.createElement("button");
    email2FAButton.className = "btn";
    email2FAButton.onclick = () => this.verififyTOTPCode();
    email2FAButton.innerText = "verify";
    this.twoFAMenu.appendChild(email2FAButton);
  }

  private verififyTOTPCode(): void {
    // console.log("yo");
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
