import { Router } from './router/Router';
import { HomePage } from './pages/home'
import { ProfilePage } from './pages/profile'
import { LocalGamePage } from './pages/localGame'
import { LoginPage } from './pages/login'
import { RegisterPage } from './pages/register'
import { SettingsPage } from './pages/settings'
import { LeaderboardPage } from './pages/leaderboard'
import { ChatPage } from './pages/chat';

// keeps state for router and passes between pages
// to add a page
// import page at the top
// add to current page type
// add in define routes

export class App {
    private router: Router;
    private container: HTMLElement;
    private currentPage: HomePage 
    | ProfilePage 
    | LocalGamePage 
    | LoginPage 
    | RegisterPage 
    | SettingsPage
    | LeaderboardPage
    | ChatPage
    | null = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'w-full h-screen';
        this.router = new Router();
        
        // Define routes
        this.router.add('/', () => this.showPage(HomePage));
        this.router.add('/local', () => this.showPage(LocalGamePage));
        this.router.add('/profile', () => this.showPage(ProfilePage));
        this.router.add('/login', () => this.showPage(LoginPage));
        this.router.add('/register', () => this.showPage(RegisterPage));
        this.router.add('/settings', () => this.showPage(SettingsPage));
        this.router.add('/leaderboard', () => this.showPage(LeaderboardPage));
        this.router.add('/chat', () => this.showPage(ChatPage));
        // Initialize router
        this.router.init();
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    private showPage(PageClass: { new(router: Router): 
        HomePage 
        | ProfilePage 
        | LocalGamePage 
        | LoginPage 
        | RegisterPage 
        | SettingsPage 
        | LeaderboardPage
        | ChatPage
        }) {
        if (this.currentPage) {
            this.currentPage.unmount();
        }
        this.currentPage = new PageClass(this.router);
        if (this.currentPage) {
            this.currentPage.mount(this.container);
        }
    }
}