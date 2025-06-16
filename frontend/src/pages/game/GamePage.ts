import { Router } from '../../router';
// import { PongGame } from '../../components/game/PongGame';

export class GamePage {
    private element: HTMLElement;
    // private game: PongGame | null = null;

    constructor(private router: Router) {
        this.element = document.createElement('div');
        this.element.className = 'flex flex-col w-full min-h-full items-center justify-center';
        
        const gameContainer = document.createElement('div');
        gameContainer.className = 'sys-window w-3/4 h-3/4 flex items-center justify-center';
        
        // this.game = new PongGame();
        
        const backButton = document.createElement('button');
        backButton.className = 'btn w-36';
        backButton.textContent = 'back';
        backButton.onclick = () => this.handleBackClick();
        
        this.element.appendChild(gameContainer);
        // this.game.mount(gameContainer);
        this.element.appendChild(backButton);
    }

    private handleBackClick(): void {
        // if (this.game) {
        //     this.game.stop();
        // }
        this.router.navigateBack();
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
        // if (this.game) {
        //     this.game.start();
        // }
    }

    public unmount(): void {
        // if (this.game) {
        //     this.game.stop();
        // }
        this.element.remove();
    }
}