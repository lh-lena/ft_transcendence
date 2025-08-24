// services
import { ServiceContainer, Router, Websocket, Backend } from "./services";

// pages
import { HomePage } from "./pages/home";
import { ProfilePage } from "./pages/profile";
import { LocalGamePage } from "./pages/localGame";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { SettingsPage } from "./pages/settings";
import { LeaderboardPage } from "./pages/leaderboard";
import { ChatPage } from "./pages/chat";
import { VsPlayerGamePage } from "./pages/remoteGame";
import { TournamentAliasPage } from "./pages/tournament";

// single source of truth for pages and routes
const PAGE_ROUTES = {
  "/": HomePage,
  "/local": LocalGamePage,
  "/profile": ProfilePage,
  "/login": LoginPage,
  "/register": RegisterPage,
  "/settings": SettingsPage,
  "/leaderboard": LeaderboardPage,
  "/chat": ChatPage,
  "/vs-player": VsPlayerGamePage,
  "/tournament-start": TournamentAliasPage,
} as const;

// type magic
type PageConstructor = (typeof PAGE_ROUTES)[keyof typeof PAGE_ROUTES];
type PageInstance = InstanceType<PageConstructor> | null;

export class App {
  private serviceContainer: ServiceContainer;
  private router: Router;
  private ws: Websocket;
  private container: HTMLElement;
  private currentPage: PageInstance;

  constructor() {
    // full screen div for app
    this.container = document.createElement("div");
    this.container.className = "w-full h-screen";

    // init state needs to be null
    this.currentPage = null;

    // set up service container
    this.serviceContainer = ServiceContainer.getInstance();
    this.serviceContainer.register("router", new Router());
    this.serviceContainer.register("websocket", new Websocket());
    this.serviceContainer.register("backend", new Backend());

    // grab route from service container
    this.router = this.serviceContainer.get<Router>("router");

    // grab ws
    this.ws = this.serviceContainer.get<Websocket>("websocket");

    // Define routes from single source
    Object.entries(PAGE_ROUTES).forEach(([route, PageClass]) => {
      this.router.add(route, () => this.showPage(PageClass));
    });
    this.router.init();
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  private showPage(PageClass: PageConstructor) {
    if (this.currentPage) {
      this.currentPage.unmount();
    }
    this.currentPage = new PageClass(this.serviceContainer);
    this.currentPage.mount(this.container);
  }
}
