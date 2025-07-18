import { Router } from '../../router'
import { Menu, MenuItem } from '../../components/menu'
import { ProfileAvatar } from '../../components/profileAvatar'
import { Loading } from '../../components/loading'
import { MenuBar } from '../../components/menuBar'
import { CANVAS_DEFAULTS } from '../../types'
import { Window } from '../../components/window'

// TODO-BACKEND
import { userStore } from '../../types'

export class ProfilePage {
    private container: HTMLElement;
    private menuStart: Menu;
    private menuGame: Menu;
    private loadingScreen: Loading;
    private menuBar: MenuBar;

    constructor(private router: Router) {
        // Full page background
        this.container = document.createElement('div');
        this.container.className = 'profile-bg w-full min-h-screen flex items-center justify-center bg-brandBlue';

        // Window content
        const menuBarItems = [
        {
            label: 'start Game',
            items: [
            { label: 'Local Game', href: '/local' },
            { label: 'Vs AI', href: '/vs-ai' },
            { label: 'Vs Player', href: '/vs-player' }
            ]
        },
        {
            label: 'settings',
            href: '/settings'
        },
        {
            label: 'logout',
            href: '/logout'
        }
        ];

        this.menuBar = new MenuBar(router, menuBarItems);
        const menuBarElement = this.menuBar.render();
        menuBarElement.classList.add('self-start');

        const profilePic = new ProfileAvatar(userStore.colorMap, 40, 40, 2).getElement();
        profilePic.className = 'animate-bounce-slow border-2 border-black';

        const header = document.createElement('h1');
        header.textContent = `hi ${userStore.username}`;
        header.className = 'text-black title text-2xl';

        // use Window component
        const windowComponent = new Window({
            title: 'Profile',
            width: CANVAS_DEFAULTS.width,
            height: CANVAS_DEFAULTS.height,
            className: '',
            children: [menuBarElement, profilePic, header]
        });
        this.container.appendChild(windowComponent.getElement());

        // waiting for opponent loading screen
        this.loadingScreen = new Loading('waiting for opponent', 'button', this.cancelWaitForOpponent.bind(this));
    }

    private showGameMenu(): void {
        this.menuStart.unmount();
        this.menuGame.mount(this.container)
    }

    private hideGameMenu(): void {
        this.menuGame.unmount();
        this.menuStart.mount(this.container)
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
        // this.menuStart.mount(this.container);
    }

    public unmount(): void {
        this.container.remove();
    }

    private waitForOpponent(): void {
        // this.container.remove();
        this.loadingScreen.mount(document.body);
    }

    private cancelWaitForOpponent(): void {
        this.loadingScreen.hide();    
    }
}