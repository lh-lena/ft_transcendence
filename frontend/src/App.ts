// services
import { ServiceContainer, Router, Websocket, Backend } from "./services";

// pages
import { HomePage } from "./pages/home";
import { LocalGamePage } from "./pages/localGame";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { SettingsPage } from "./pages/settings";
import { ChatPage } from "./pages/chat";
import { VsPlayerGamePage } from "./pages/remoteGame";
import { TournamentAliasPage } from "./pages/tournament";
import { GamePage } from "./pages/gamePage";
import { AIGamePage } from "./pages/aiGamePage";

// routes
import { protectedRoutes } from "./constants/routes";

// eventbus
import { EventBus } from "./services/EventBus";

// single source of truth for pages and routes
const PAGE_ROUTES = {
  "/": HomePage,
  "/local": LocalGamePage,
  "/login": LoginPage,
  "/register": RegisterPage,
  "/settings": SettingsPage,
  "/chat": ChatPage, // -> main page now (home when logged in)
  "/vs-player": VsPlayerGamePage,
  "/tournament-start": TournamentAliasPage,
  "/game-page": GamePage,
  "/ai-game": AIGamePage,
} as const;

// type magic
type PageConstructor = (typeof PAGE_ROUTES)[keyof typeof PAGE_ROUTES];
type PageInstance = InstanceType<PageConstructor> | null;

export class App {
  private serviceContainer: ServiceContainer;
  private router: Router;
  private container: HTMLElement;
  private currentPage: PageInstance;
  private websocket: Websocket;
  private backend: Backend;
  private eventBus: EventBus;

  constructor() {
    // full screen div for app
    this.container = document.createElement("div");
    this.container.className = "w-full h-screen";

    this.eventBus = new EventBus();

    // init state needs to be null
    this.currentPage = null;

    // set up service container
    this.serviceContainer = ServiceContainer.getInstance();
    this.serviceContainer.register("router", new Router());
    this.serviceContainer.register("websocket", new Websocket());
    this.serviceContainer.register("backend", new Backend(this.eventBus));

    // save web socket
    this.websocket = this.serviceContainer.get<Websocket>("websocket");
    this.backend = this.serviceContainer.get<Backend>("backend");

    // event bus
    // listen for logout events
    this.eventBus.on("auth:logout", () => {
      this.router.navigate("/");
    });

    // grab route from service container
    this.router = this.serviceContainer.get<Router>("router");

    // Define routes from single source
    Object.entries(PAGE_ROUTES).forEach(([route, PageClass]) => {
      this.router.add(route, async () => {
        await this.showPage(PageClass);
      });
    });
    this.router.init();
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  private async showPage(PageClass: PageConstructor) {
    // unmount current page
    if (this.currentPage) {
      this.currentPage.unmount();
    }

    // create a new web socket connection across each page reload
    // only if in logged in area

    let currentRoute = this.router.getCurrentRoute();

    // we always connect back to web socket before we load a page
    if (protectedRoutes.includes(currentRoute)) {
      await this.websocket.initializeWebSocket();
    }

    // handle ChatPage's async initialization
    // else create new page
    if (PageClass === ChatPage) {
      this.currentPage = await ChatPage.create(this.serviceContainer);
    } else {
      this.currentPage = new PageClass(this.serviceContainer);
    }

    this.currentPage.mount(this.container);
  }
}
