import { Router } from '../../router';
import { PongGame } from '../../game';
import { Countdown } from '../../components/countdown'
import { GameState, GameStatus } from '../../types'

export class GamePage {
    private element: HTMLElement;
    private game: PongGame | null = null;
    private gameState: GameState;
    private countdown: Countdown;

    constructor(private router: Router) {

        this.gameState = {
            status: GameStatus.PLAYING,
            playerA: {username: 'playerA', score: 0 },
            playerB: {username: 'playerB', score: 0 },
        }

        this.element = document.createElement('div');
        this.element.className = 'sys-window flex flex-col gap-1 w-full min-h-full items-center justify-center bg-[#0400FF]';

        // Initialize Countdown
        this.countdown = new Countdown();
        // Mount Countdown
        this.countdown.mount(this.element);
        // Start Countdown and proceed to game after it finishes
        this.countdown.start(() => {
            this.initializeGame(); // Initialize game after countdown
        });
    }

    private initializeGame(): void {
        const scoreBar = document.createElement('div');
        scoreBar.className = 'flex flex-row justify-between w-[600px]';
        this.element.appendChild(scoreBar);

        const scoreA = document.createElement('h1');
        scoreA.textContent = `playerA: [${this.gameState.playerA.score}]`;
        scoreA.id = 'score-a';
        scoreA.className = 'text-white';
        scoreBar.appendChild(scoreA);

        const pauseButton = document.createElement('button');
        pauseButton.innerText = 'pause';
        pauseButton.className = 'btn w-36';
        pauseButton.tabIndex = -1;
        scoreBar.appendChild(pauseButton);

        const scoreB = document.createElement('h1');
        scoreB.textContent = `playerB: [${this.gameState.playerB.score}]`;
        scoreB.id = 'score-b';
        scoreB.className = 'text-white';
        scoreBar.appendChild(scoreB);

        const gameContainer = document.createElement('div');
        gameContainer.className = 'flex items-center justify-center';

        this.game = new PongGame((scoreA, scoreB) => this.updateScores(scoreA, scoreB));
        this.element.appendChild(gameContainer);
        this.game.mount(gameContainer);

        const backButton = document.createElement('button');
        backButton.className = 'btn w-36';
        backButton.textContent = 'quit';
        backButton.onclick = () => this.handleBackClick();
        this.element.appendChild(backButton);
    }

    private updateScores(scoreA: number, scoreB: number): void {
        this.gameState.playerA.score = scoreA; // Update playerA's score
        this.gameState.playerB.score = scoreB; // Update playerB's score

        const scoreAElement = this.element.querySelector('#score-a') as HTMLElement;
        const scoreBElement = this.element.querySelector('#score-b') as HTMLElement;

        scoreAElement.textContent = `playerA: [${this.gameState.playerA.score}]`;
        scoreBElement.textContent = `playerB: [${this.gameState.playerB.score}]`;

        // add animation to current winner
        if (this.gameState.playerA.score > this.gameState.playerB.score) {
            scoreAElement.className = 'text-white animate-bounce';
            scoreBElement.className = 'text-white';
        }
        else {
            scoreBElement.className = 'text-white animate-bounce';
            scoreAElement.className = 'text-white';
        }
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