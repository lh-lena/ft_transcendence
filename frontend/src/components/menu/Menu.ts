import { Router } from '../../router'

export class Menu {
    private element: HTMLElement;

    constructor(private router: Router) {
        this.element = document.createElement('div');
        this.element.className = 'sys-window flex flex-col items-center justify-center w-full h-full gap-3';
        this.createMenuContent();
    }

    private createMenuContent(): void {
        const star = document.createElement('div');
        star.className = 'animate-spin-slow star_8 w-4 mb-4';

        const startButton = document.createElement('button');
        startButton.className = 'btn w-36';
        startButton.textContent = 'start game';
        startButton.onclick = () => this.handleStartGame();

        const settingsButton = document.createElement('button');
        settingsButton.className = 'btn w-36';
        settingsButton.textContent = 'profile';
        settingsButton.onclick = () => this.handleProfileClick();

        this.element.appendChild(star);
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