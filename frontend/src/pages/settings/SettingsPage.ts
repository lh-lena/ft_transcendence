import { Router } from "../../router";
import { CANVAS_DEFAULTS } from "../../types";
import { Window } from "../../components/window";
import { MenuBar } from "../../components/menuBar";

const securitySettings = [
  { label: "2FA", value: "on" },
  { label: "password", value: "change" },
];

const otherSettings = [
  { label: "other", value: "off" },
  { label: "this", value: "change" },
];

const settingCategories = [
  { label: "security", settingsList: securitySettings },
  { label: "other", settingsList: otherSettings },
];

export class SettingsPage {
  private main: HTMLElement;
  private settingsPanel: HTMLDivElement;
  private activeButton!: HTMLElement;

  constructor(private router: Router) {
    // Full page background
    this.main = document.createElement("div");
    this.main.className =
      "w-full min-h-screen flex items-center justify-center bg-brandBlue";

    // Window content

    const buttonRow = document.createElement("div");
    buttonRow.className = "flex flex-row gap-3";

    settingCategories.forEach((item, idx) => {
      const button = document.createElement("button");
      button.className = "btn flex items-center justify-center w-24";
      if (idx === 0) {
        button.classList.add("btn-default");
        this.activeButton = button;
      }
      button.textContent = item.label;
      button.onclick = () => this.toggleButton(button, item.settingsList);
      buttonRow.appendChild(button);
    });

    const menuBar = new MenuBar(router, "settings");

    // settings main
    this.settingsPanel = document.createElement("div");
    this.settingsPanel.className = "flex flex-col w-64 gap-2";

    // use security settings as default for page
    this.populateSettingsPanel(securitySettings);

    const windowComponent = new Window({
      title: "Settings",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBar.render(), buttonRow, this.settingsPanel],
    });

    this.main.appendChild(windowComponent.getElement());
  }

  // need to implement a function that can change button design based on state. is refreshed on load from backend
  private toggleButton(
    button: HTMLElement,
    settingsList: Array<{ label: string; value: string }>,
  ): void {
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

  private populateSettingsPanel(
    settingsList: Array<{ label: string; value: string }>,
  ): void {
    settingsList.forEach((setting) => {
      const box = document.createElement("div");
      box.className = "flex flex-row gap-2 standard-dialog items-center";
      const boxTitle = document.createElement("h1");
      boxTitle.textContent = setting.label;
      box.appendChild(boxTitle);
      const boxButton = document.createElement("button");
      boxButton.innerText = setting.value;
      boxButton.className = "btn ml-auto";
      if (setting.value == "on")
        boxButton.className = "btn active ml-auto bg-black text-white rounded";
      box.appendChild(boxButton);
      this.settingsPanel.appendChild(box);
    });
  }

  private changeActiveCategoryButton(button: HTMLElement) {
    this.activeButton.classList.remove("btn-default");
    button.classList.add("btn-default");
    this.activeButton = button;
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  public unmount(): void {
    this.main.remove();
  }
}
