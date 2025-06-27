import { Router } from '../../router'

export class Menu {
    private element: HTMLElement;

    constructor(private router: Router) {
        this.element = document.createElement('div');
        this.element.className = 'sys-window flex flex-col items-center justify-center w-full h-full gap-5';
        this.createMenuContent();
    }

    private createMenuContent(): void {
        const title = document.createElement('h1');
        title.className = 'title text-white text-3xl';
        title.textContent = 'pong';

        const startButton = document.createElement('button');
        startButton.className = 'btn w-36';
        startButton.textContent = 'start game';
        startButton.onclick = () => this.handleStartGame();

        const settingsButton = document.createElement('button');
        settingsButton.className = 'btn w-36';
        settingsButton.textContent = 'profile';
        settingsButton.onclick = () => this.handleProfileClick();

        this.element.appendChild(title);
        this.element.appendChild(startButton);
        this.element.appendChild(settingsButton);
    }

    private handleProfileClick(): void {
        this.router.navigate('/profile');
    }

    private handleStartGame(): void {
        this.router.navigate('/game');
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }
}