export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  public register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  public get<T>(name: string): T {
    return this.services.get(name);
  }
}
