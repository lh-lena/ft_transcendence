import { Router } from '../../router';
import { PongGame } from '../../game';
import { Countdown } from '../../components/countdown'
import { GameState, GameStatus } from '../../types'
import { PausePlay } from '../../components/pausePlay'
import { SpectatorBar } from '../../components/spectatorBar'
import { ScoreBar } from '../../components/scoreBar'
import { generateProfilePrint } from '../../utils/generateProfilePrint'

// TODO-BACKEND switch out for backend data cached on merge
import { userStore } from '../../types'

export class LocalGamePage {
    private element: HTMLElement;
    private game: PongGame | null = null;
    private gameState: GameState;
    private countdown: Countdown;
    private pausePlay: PausePlay;
    private spectatorBar: SpectatorBar;
    private scoreBar: ScoreBar;

    constructor(private router: Router) {

        // for player A
        const { color, colorMap } = generateProfilePrint();

        this.gameState = {
            status: GameStatus.PLAYING,
            playerA: {username: 'left', score: 0, color: color, colorMap: colorMap},
            playerB: {username:  userStore.username , score: 0, color: userStore.color, colorMap: userStore.colorMap},
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
        const gameContainer = document.createElement('div');
        gameContainer.className = 'flex items-center justify-center';

        this.scoreBar = new ScoreBar(this.gameState);
        this.scoreBar.mount(this.element);

        this.game = new PongGame((scoreA, scoreB) => this.scoreBar.updateScores(scoreA, scoreB), this.gameState);
        this.element.appendChild(gameContainer);
        this.game.mount(gameContainer);

        this.spectatorBar = new SpectatorBar();
        this.spectatorBar.mount(this.element);
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