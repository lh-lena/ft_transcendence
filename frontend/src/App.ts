import { Router } from './router/Router';
import { HomePage } from './pages/home'
import { ProfilePage } from './pages/profile'
import { LocalGamePage } from './pages/localGame'
import { LoginPage } from './pages/login'
import { RegisterPage } from './pages/register'

export class App {
    private router: Router;
    private container: HTMLElement;
    private currentPage: HomePage | ProfilePage | LocalGamePage | LoginPage | RegisterPage | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'w-full h-screen';
        this.router = new Router();
        
        // Define routes
        this.router.add('/', () => this.showHome());
        this.router.add('/game', () => this.showGame());
        this.router.add('/profile', () => this.showProfile());
        this.router.add('/login', () => this.showLogin());
        this.router.add('/register', () => this.showRegister());

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

    private showLogin(): void {
        if (this.currentPage) {
            this.currentPage.unmount();
        }
        this.currentPage = new LoginPage(this.router);
        this.currentPage.mount(this.container);
    }

    private showRegister(): void {
        if (this.currentPage) { 
            this.currentPage.unmount();
        }
        this.currentPage = new RegisterPage(this.router);
        this.currentPage.mount(this.container);
    }

    private showGame(): void {
        if (this.currentPage) {
            this.currentPage.unmount();
        }
        this.currentPage = new LocalGamePage(this.router);
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