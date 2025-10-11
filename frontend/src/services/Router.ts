import { showError } from "../components/toast";

import { protectedRoutes } from "../constants/routes";

export class Router {
  private routes: Map<string, () => void>;
  private wasButtonNavigation: boolean = false;

  constructor() {
    this.routes = new Map();

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
      this.wasButtonNavigation = true;
      this.handleRoute(window.location.pathname);
    });
  }

  public add(path: string, callback: () => void): void {
    this.routes.set(path, callback);
  }

  // also allows to add query params to navigation call
  public navigate(path: string, params?: Record<string, string>): void {
    this.wasButtonNavigation = false; // reset
    let fullPath = path;
    if (params) {
      const searchParams = new URLSearchParams(params);
      fullPath = `${path}?${searchParams.toString()}`;
    }
    window.history.pushState({}, "", fullPath);
    this.handleRoute(path);
  }

  // check if last navigation was via browser buttons
  public wasButtonNavigated(): boolean {
    const result = this.wasButtonNavigation;
    this.wasButtonNavigation = false; // Reset after checking
    return result;
  }

  // Add method to get current query parameters
  public getQueryParams(): URLSearchParams {
    return new URLSearchParams(window.location.search);
  }

  public navigateBack(): void {
    window.history.back();
  }

  private handleRoute(path: string): void {
    // check to make sure only users access authorized content
    if (protectedRoutes.includes(path) && !localStorage.getItem("user")) {
      this.navigate("/");
      showError("unauthorized access detected. please login");
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

  public getCurrentRoute(): string {
    return window.location.pathname;
  }

  public init(): void {
    this.handleRoute(window.location.pathname);
  }
}
