import { Router, ServiceContainer, Backend, Websocket } from "../../services";
import { HomeIcon } from "../homeIcon/HomeIcon";

export interface MenuBarItem {
  label: string;
  items?: Array<{
    label: string;
    href?: string;
    divider?: boolean;
    style?: string;
    onclick?: () => void;
  }>;
  href?: string;
  style?: string;
  onclick?: () => void;
}

export class MenuBar {
  router: Router;
  backend: Backend;
  websocket: Websocket;
  menuBarItems: MenuBarItem[];
  skipThis: string | undefined;

  constructor(serviceContainer: ServiceContainer, skipThis?: string) {
    const defaultMenuBarItems: MenuBarItem[] = [
      {
        label: "start Game",
        items: [
          { label: "Local Game", href: "/local" },
          { label: "Vs AI", onclick: () => this.aiGameFlow() },
          { label: "Vs Player", onclick: () => this.joinGameFlow() },
          { label: "Tournament", onclick: () => this.joinTournamentFlow() },
        ],
      },
      // { label: "profile", href: "/profile" },
      // { label: "friends", href: "/chat" },
      { label: "settings", href: "/settings" },
      // { label: "leaderboard", href: "/leaderboard" },
      { label: "logout", onclick: () => this.logoutFlow() },
    ];
    this.router = serviceContainer.get<Router>("router");
    this.backend = serviceContainer.get<Backend>("backend");
    this.websocket = serviceContainer.get<Websocket>("websocket");
    this.skipThis = skipThis;
    this.menuBarItems = defaultMenuBarItems.slice();
  }

  private aiGameFlow() {
    // navigate with game type parameter
    this.router.navigate("/ai-game");
  }

  private async joinTournamentFlow() {
    this.router.navigate("/tournament-start", {
      userType: "registered",
    });
  }

  private async joinGameFlow() {
    // navigate with game type parameter
    this.router.navigate("/vs-player", {
      gameType: "vs-player",
    });
  }

  private logoutFlow() {
    this.backend.logout();
    this.websocket.close();
    this.router.navigate("/");
  }

  render(): HTMLElement {
    const ul = document.createElement("ul");
    ul.setAttribute("role", "menu-bar");

    // add HomeIcon as the first menu item
    const homeLi = document.createElement("li");
    homeLi.setAttribute("role", "menu-item");
    homeLi.setAttribute("tabindex", "0");
    // use HomeIcon and make it clickable to navigate to home
    const homeIcon = new HomeIcon(() => {
      this.router.navigate("/chat");
    });
    homeLi.appendChild(homeIcon["main"] || homeIcon["main"]);
    ul.appendChild(homeLi);

    this.menuBarItems.forEach((menu: MenuBarItem) => {
      if (this.skipThis && menu.label == this.skipThis) return;
      const li = document.createElement("li");
      li.setAttribute("role", "menu-item");
      li.setAttribute("tabindex", "0");

      // Single item (no dropdown)
      if (!menu.items || menu.items.length === 0) {
        li.setAttribute("aria-haspopup", "false");

        if (menu.onclick) {
          // Handle onclick for single menu items
          li.style.cursor = "pointer";
          li.textContent = menu.label;
          li.onclick = (e) => {
            e.preventDefault();
            menu.onclick!();
          };
          if (menu.style) li.className = menu.style;
        } else if (menu.href) {
          const a = document.createElement("a");
          a.textContent = menu.label;
          a.href = menu.href;
          if (menu.style) a.className = menu.style;
          li.appendChild(a);
        } else {
          li.textContent = menu.label;
          if (menu.style) li.className = menu.style;
        }
        ul.appendChild(li);
        return;
      }

      // Dropdown menu
      li.setAttribute("aria-haspopup", "true");
      li.textContent = menu.label;
      if (menu.style) li.className = menu.style;

      const subUl = document.createElement("ul");
      subUl.setAttribute("role", "menu");

      menu.items.forEach((item) => {
        const subLi = document.createElement("li");
        subLi.setAttribute("role", "menu-item");
        if (item.divider) subLi.classList.add("divider");
        if (item.style) subLi.className = item.style;
        const a = document.createElement("a");
        a.textContent = item.label;
        if (item.href) a.href = item.href;
        else if (item.onclick) a.onclick = item.onclick;
        else {
          a.href = "#menu";
        }
        subLi.appendChild(a);
        subUl.appendChild(subLi);
      });

      li.appendChild(subUl);
      ul.appendChild(li);
    });

    return ul;
  }
}
