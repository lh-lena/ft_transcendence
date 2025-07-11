import { Menu } from '../../components/menu';
import { Router } from '../../router'
import { PongButton } from '../../components/pongButton'

export class HomePage {
    private main: HTMLElement;
    private menu: Menu;
    private pongButton: PongButton;

    constructor(private router: Router) {
        this.main = document.createElement('div');
        this.main.className = 'flex flex-col gap-5 w-full min-h-full justify-center items-center bg-[#0400FF]';

        this.pongButton = new PongButton();
        this.pongButton.setBounce();
        this.pongButton.mount(this.main);

        // menu for when user is not logged in
        const notLoggedInMenu = [
            // obv will be changing this to /loginAuth for logins
            { name: 'log in', link: '/login' },
            { name: 'register', link: '/register' }
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