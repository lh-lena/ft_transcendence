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
    const callback = this.routes.get(path);
    if (callback) {
      callback();
    } else {
      // handle 404 or redirect to home
      this.navigate("/");
    }
  }

  public init(): void {
    this.handleRoute(window.location.pathname);
  }
}
