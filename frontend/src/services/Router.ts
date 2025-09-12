// routes we need to check user in local storage for
const protectedRoutes = [
  "/chat",
  "/settings",
  "/local",
  "/vs-player",
  "/tournament-start",
];

export class Router {
  private routes: Map<string, () => void>;

  constructor() {
    this.routes = new Map();

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.handleRoute(window.location.pathname);
    });
  }

  public add(path: string, callback: () => void): void {
    this.routes.set(path, callback);
  }

  public navigate(path: string): void {
    window.history.pushState({}, "", path);
    this.handleRoute(path);
  }

  public navigateBack(): void {
    window.history.back();
  }

  private handleRoute(path: string): void {
    // specific function to handle logout
    if (path === "/logout") {
      this.handleLogout();
      this.navigate("/");
      return;
    }
    // check to make sure only users access authorized content
    if (protectedRoutes.includes(path) && !localStorage.getItem("user")) {
      this.navigate("/");
      alert("unauthorized access detected. please login");
      return;
    }
    // else we can do a regular navigate
    const callback = this.routes.get(path);
    if (callback) {
      callback();
    } else {
      // handle 404 or redirect to home (chat)
      this.navigate("/");
    }
  }

  private handleLogout(): void {
    // delete user from local storage
    const savedUser = localStorage.getItem("user");
    if (savedUser) localStorage.removeItem("user");
  }

  public init(): void {
    this.handleRoute(window.location.pathname);
  }
}
