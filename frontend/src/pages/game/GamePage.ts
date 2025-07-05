import { Router } from '../../router';
import { PongGame } from '../../game';

import { Player } from '../../types';

export class GamePage {
    private element: HTMLElement;
    private game: PongGame | null = null;
    private playerA: Player;
    private playerB: Player;

    constructor(private router: Router) {
        this.playerA = { username: 'playerA', score: 0 }; // Initialize playerA
        this.playerB = { username: 'playerB', score: 0 }; // Initialize playerB

        this.element = document.createElement('div');
        this.element.className = 'sys-window flex flex-col gap-1 w-full min-h-full items-center justify-center bg-[#0400FF]';
        
        const scoreBar = document.createElement('div');
        scoreBar.className = 'flex flex-row justify-between w-[600px]';
        this.element.appendChild(scoreBar);

        const scoreA = document.createElement('h1'); 
        scoreA.textContent = `playerA: [${this.playerA.score}]`; // Use playerA.score
        scoreA.className = 'text-white';
        scoreBar.appendChild(scoreA);

        const scoreB = document.createElement('h1'); 
        scoreB.textContent = `playerB: [${this.playerB.score}]`; // Use playerB.score
        scoreB.className = 'text-white';
        scoreBar.appendChild(scoreB);

        const gameContainer = document.createElement('div');
        gameContainer.className = 'flex items-center justify-center';

        this.game = new PongGame((scoreA, scoreB) => this.updateScores(scoreA, scoreB)); // Pass callback to update scores

        const backButton = document.createElement('button');
        backButton.className = 'btn w-36';
        backButton.textContent = 'quit';
        backButton.onclick = () => this.handleBackClick();

        this.element.appendChild(gameContainer);
        this.game.mount(gameContainer);
        this.element.appendChild(backButton);
    }

    private updateScores(scoreA: number, scoreB: number): void {
        this.playerA.score = scoreA; // Update playerA's score
        this.playerB.score = scoreB; // Update playerB's score

        const scoreAElement = this.element.querySelector('h1:nth-child(1)') as HTMLElement;
        const scoreBElement = this.element.querySelector('h1:nth-child(2)') as HTMLElement;

        scoreAElement.textContent = `playerA: [${this.playerA.score}]`;
        scoreBElement.textContent = `playerB: [${this.playerB.score}]`;
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