export class Menu {
    private element: HTMLElement;

    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'sys-window flex flex-col items-center justify-center w-full h-full gap-3';
        this.createMenuContent();
    }

    private createMenuContent(): void {
        const title = document.createElement('h1');
        title.className = 'sys-text text-2xl';
        title.textContent = 'Pong';

        const startButton = document.createElement('button');
        startButton.className = 'btn w-36';
        startButton.textContent = 'Start Game';
        startButton.onclick = () => this.handleStartGame();

        const settingsButton = document.createElement('button');
        settingsButton.className = 'btn w-36';
        settingsButton.textContent = 'Settings';

        this.element.appendChild(title);
        this.element.appendChild(startButton);
        this.element.appendChild(settingsButton);
    }

    private handleStartGame(): void {
        // We'll implement this when we create the game component
        console.log('Starting game...');
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }
}