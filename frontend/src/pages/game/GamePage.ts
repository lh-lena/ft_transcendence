import { Router } from '../../router';
import { PongGame } from '../../game';

export class GamePage {
    private element: HTMLElement;
    private game: PongGame | null = null;

    constructor(private router: Router) {
        this.element = document.createElement('div');
        this.element.className = 'sys-window flex flex-col gap-5 w-full min-h-full items-center justify-center bg-[#0400FF]';
        
        const gameContainer = document.createElement('div');
        gameContainer.className = 'w-3/4 h-3/4 flex items-center justify-center';
        
        this.game = new PongGame();
        
        const backButton = document.createElement('button');
        backButton.className = 'btn w-36';
        backButton.textContent = 'back';
        backButton.onclick = () => this.handleBackClick();

        this.element.appendChild(gameContainer);
        this.game.mount(gameContainer);
        this.element.appendChild(backButton);
    }

    private handleBackClick(): void {
        this.router.navigateBack();
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }

    public unmount(): void {
        this.element.remove();
    }
}