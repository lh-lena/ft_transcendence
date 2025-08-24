import { ServiceContainer, Router } from "../../services";
import { CANVAS_DEFAULTS } from "../../types";
import { Window } from "../../components/window";
import { MenuBar } from "../../components/menuBar";

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
// y not
const securitySettings: settingList = [
  { label: "2FA", value: "on", type: "button" },
  {
    label: "password",
    value: "change",
    type: "button",
    // define on click in constructor
  },
];

const otherSettings = [
  // { label: "other", value: "off" },
  { label: "avatar", value: "upload", type: "file" },
];

const settingCategories = [
  { label: "security", settingsList: securitySettings },
  { label: "profile", settingsList: otherSettings },
];

export class SettingsPage {
  private main: HTMLElement;
  private window: Window;
  private settingsPanel: HTMLDivElement;
  private buttonRow: HTMLDivElement;
  private activeButton!: HTMLElement;
  private inputPasswordDiv!: HTMLDivElement;
  private serviceContainer: ServiceContainer;
  private router: Router;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");

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

    const menuBar = new MenuBar(this.router, "settings");

    // settings main
    this.settingsPanel = document.createElement("div");
    this.settingsPanel.className = "flex flex-col w-64 gap-2";

    // on clicks link functions to settings
    // needed this object to link functions
    // using optional chaining (!) because we are sure it exists other wise we would write more defensively
    securitySettings.find((setting) => setting.label === "password")!.onClick =
      () => this.changePassword();

    // use security settings as default for page
    this.populateSettingsPanel(securitySettings);

    this.window = new Window({
      title: "Settings",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBar.render(), this.buttonRow, this.settingsPanel],
    });

    this.main.appendChild(this.window.getElement());
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
      box.className = "flex flex-row gap-2 standard-dialog items-center";
      const boxTitle = document.createElement("h1");
      boxTitle.textContent = setting.label;
      box.appendChild(boxTitle);
      this.settingsPanel.appendChild(box);
      if (setting.type == "file") {
        // create hidden file input
        const boxInputFile = document.createElement("input");
        boxInputFile.type = "file";
        boxInputFile.id = `file-${setting.label}`;
        boxInputFile.className = "hidden";
        // create styled label that looks like your buttons
        const fileLabel = document.createElement("label");
        fileLabel.htmlFor = boxInputFile.id;
        fileLabel.textContent = setting.value;
        fileLabel.className = "btn ml-auto cursor-pointer";
        box.appendChild(boxInputFile);
        box.appendChild(fileLabel);
      } else if (setting.type == "button") {
        const boxButton = document.createElement("button");
        boxButton.innerText = setting.value;
        boxButton.className = "btn ml-auto";
        if (setting.value == "on")
          boxButton.className =
            "btn active ml-auto bg-black text-white rounded";
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
    // hide
    if (this.window.getElement().contains(this.settingsPanel)) {
      this.settingsPanel.remove();
      this.buttonRow.remove();

      // new password stuff
      this.inputPasswordDiv = document.createElement("div");
      this.inputPasswordDiv.className = "flex h-full pt-4 flex-col gap-5 w-36";
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
      this.window.getElement().appendChild(this.inputPasswordDiv);
      this.window.getPane().appendChild(this.inputPasswordDiv);
      const inputPasswordButton = document.createElement("button");
      inputPasswordButton.className = "btn";
      inputPasswordButton.onclick = () => this.changePassword();
      inputPasswordButton.innerText = "change";
      this.inputPasswordDiv.appendChild(inputPasswordButton);
    } // show
    else {
      this.inputPasswordDiv.remove();
      this.window.getPane().appendChild(this.buttonRow);
      this.window.getPane().appendChild(this.settingsPanel);
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
