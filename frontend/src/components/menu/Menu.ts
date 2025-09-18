import { Router } from "../../services";

export interface MenuItem {
  name: string; // button text
  link?: string; // optional URL link
  onClick?: () => void; // optional custom callback
  style?: string;
}

export class Menu {
  private element: HTMLElement;
  private menuItems: MenuItem[];
  private router: Router;

  constructor(router: Router, menuItems: MenuItem[]) {
    this.router = router;
    this.menuItems = menuItems;
    this.element = document.createElement("div");
    this.element.className =
      "sys-window flex flex-col items-center justify-center w-full h-full gap-5";
    this.createMenuContent();
  }

  get menuElement(): HTMLElement {
    return this.element;
  }

  private createMenuContent(): void {
    this.menuItems.forEach((item) => {
      const button = document.createElement("button");
      button.className = "btn w-36";
      if (item.style == "tiny")
        button.className =
          "btn flex items-center justify-center w-8 h-8 bg-brandBlue";
      button.textContent = item.name;
      if (typeof item.link === "string") {
        button.onclick = () => this.router.navigate(item.link as string);
      }
      if (item.onClick) {
        button.onclick = item.onClick;
      }
      this.element.appendChild(button);
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
