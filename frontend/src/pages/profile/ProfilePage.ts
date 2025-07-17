import { Router } from '../../router'
import { Menu, MenuItem } from '../../components/menu'
import { ProfileAvatar } from '../../components/profileAvatar'
import { Loading } from '../../components/loading'

// TODO-BACKEND
import { userStore } from '../../types'

export class ProfilePage {
    private container: HTMLElement;
    private menuStart: Menu;
    private menuGame: Menu;
    private loadingScreen: Loading;
    private profileCard: HTMLElement;

    constructor(private router: Router) {
        this.container = document.createElement('div');
        this.container.className = 'w-full min-h-full bg-brandBlue';

        this.profileCard = document.createElement('div');
        this.profileCard.className = 'window justify-center flex flex-col gap-5 items-center';

        const titleBar = document.createElement('div');
        this.profileCard.className = 'title-bar';


        const profilePic = new ProfileAvatar(userStore.colorMap).getElement();
        profilePic.className = 'animate-bounce-slow'
        this.profileCard.appendChild(profilePic);

        const header = document.createElement('h1');
        header.textContent = `hi ${userStore.username}`;
        header.className = 'text-white text-2xl'
        this.profileCard.appendChild(header);

        const profileMenuStart: MenuItem[] = [
            { name: 'start game', onClick: () => this.showGameMenu() },
            { name: 'log out', link: '/logout'}
        ]
        this.menuStart = new Menu(this.router, profileMenuStart);

        const profileMenuGame: MenuItem[] = [
            { name: 'local game', link: '/local'},
            { name: 'vs AI', onClick: () => this.waitForOpponent()},
            { name: 'vs player', onClick: () => this.waitForOpponent()},
            { name: 'x', onClick: () =>  this.hideGameMenu(), style: 'tiny'}
        ]
        this.menuGame = new Menu(this.router, profileMenuGame);

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
        this.menuStart.mount(this.container);
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