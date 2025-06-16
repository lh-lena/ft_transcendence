import { Router } from './router/Router';
import { HomePage } from './pages/home'
import { ProfilePage } from './pages/profile'
import { GamePage } from './pages/game'

export class App {
    private router: Router;
    private container: HTMLElement;
    private currentPage: HomePage | ProfilePage | GamePage | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'w-full h-screen';
        this.router = new Router();
        
        // Define routes
        this.router.add('/', () => this.showHome());
        this.router.add('/game', () => this.showGame());
        this.router.add('/profile', () => this.showProfile());

        // Initialize router
        this.router.init();
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    private showHome(): void {
        if (this.currentPage) {
            this.currentPage.unmount();
        }
        this.currentPage = new HomePage(this.router);
        this.currentPage.mount(this.container);
    }

    private showGame(): void {
        if (this.currentPage) {
            this.currentPage.unmount();
        }
        this.currentPage = new GamePage(this.router);
        this.currentPage.mount(this.container);
    }

    private showProfile(): void {
        if (this.currentPage) {
            this.currentPage.unmount();
        }
        this.currentPage = new ProfilePage(this.router);
        this.currentPage.mount(this.container);
    }
}