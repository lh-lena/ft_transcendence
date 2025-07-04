import { Menu } from '../../components/menu';
import { Router } from '../../router'

export class HomePage {
    private main: HTMLElement;
    private menu: Menu;

    constructor(private router: Router) {
        this.main = document.createElement('div');
        this.main.className = 'flex flex-col gap-5 w-full min-h-full justify-center items-center bg-[#0400FF]';

        const title = document.createElement('h1');
        title.className = 'title text-white text-3xl';
        title.textContent = 'pong';
        this.main.appendChild(title);

        // menu for when user is not logged in
        const notLoggedInMenu = [
            // obv will be changing this to /login for logins
            { name: 'log in', link: '/login' },
        ];
        this.menu = new Menu(this.router, notLoggedInMenu);
    }

    public mount(parent: HTMLElement): void {
        this.menu.mount(this.main);
        parent.appendChild(this.main);
    }

    public unmount(): void {
        this.main.remove();
    }
}