import { Router } from '../../router'
import { ProfileAvatar } from '../../components/profileAvatar'
import { Loading } from '../../components/loading'
import { MenuBar } from '../../components/menuBar'
import { CANVAS_DEFAULTS } from '../../types'
import { Window } from '../../components/window'

// TODO-BACKEND
import { userStore } from '../../types'

export class ProfilePage {
    private container: HTMLElement;
    private loadingScreen: Loading;
    private menuBar: MenuBar;

    constructor(private router: Router) {
        // Full page background
        this.container = document.createElement('div');
        this.container.className = 'w-full min-h-screen flex items-center justify-center bg-brandBlue';

        // Window content
        

        this.menuBar = new MenuBar(router);
        const menuBarElement = this.menuBar.render();

        const profilePic = new ProfileAvatar(userStore.colorMap, 40, 40, 2).getElement();
        profilePic.className = 'animate-bounce-slow border-4 border-black';

        const header = document.createElement('h1');
        header.textContent = `hi ${userStore.username}`;
        header.className = 'text-black title text-2xl';

        const profileCard = document.createElement('div')
        profileCard.className = 'flex flex-col items-center gap-5'
        profileCard.appendChild(profilePic);
        profileCard.appendChild(header);

        const footer = document.createElement('div');

        // use Window component
        const windowComponent = new Window({
            title: 'Profile',
            width: CANVAS_DEFAULTS.width,
            height: CANVAS_DEFAULTS.height,
            className: '',
            children: [menuBarElement, profileCard, footer]
        });
        this.container.appendChild(windowComponent.getElement());

        // waiting for opponent loading screen
        this.loadingScreen = new Loading('waiting for opponent', 'button', this.cancelWaitForOpponent.bind(this));
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    public unmount(): void {
        this.container.remove();
    }

    private waitForOpponent(): void {
        this.loadingScreen.mount(document.body);
    }

    private cancelWaitForOpponent(): void {
        this.loadingScreen.hide();    
    }
}