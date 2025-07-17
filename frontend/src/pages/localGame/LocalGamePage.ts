import { Router } from '../../router';
import { PongGame } from '../../game';
import { Countdown } from '../../components/countdown'
import { GameState, GameStatus } from '../../types'
import { SpectatorBar } from '../../components/spectatorBar'
import { ScoreBar } from '../../components/scoreBar'
import { generateProfilePrint } from '../../utils/generateProfilePrint'

import { Menu } from '../../components/menu'

// TODO-BACKEND switch out for backend data cached on merge
import { userStore } from '../../types'

export class LocalGamePage {
    private element: HTMLElement;
    private game: PongGame | null = null;
    private gameState: GameState;
    private countdown: Countdown;
    private spectatorBar!: SpectatorBar;
    private scoreBar!: ScoreBar;
    private menu: Menu | null = null;
    private gameContainer: HTMLElement | null = null;

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
        this.gameContainer = document.createElement('div');
        this.gameContainer.className = 'flex items-center justify-center relative';

        // create game instance before score bar so we can pass game (need for pausing) into scorebar
        this.game = new PongGame(
            this.gameState, (scoreA, scoreB) => this.scoreBar.updateScores(scoreA, scoreB),
            () => this.checkPauseStatus()
        );

        this.scoreBar = new ScoreBar(this.gameState);
        this.scoreBar.mount(this.element);

        this.element.appendChild(this.gameContainer);
        this.game.mount(this.gameContainer);

        this.spectatorBar = new SpectatorBar();
        this.spectatorBar.mount(this.element);
    }


    private showPauseOverlay(): void {
        if (this.gameContainer && !this.menu) {
            // Create and mount menu to game container instead of main element
            const menuItems = [
                { name: 'quit', link: '/profile' }
            ];
            this.menu = new Menu(this.router, menuItems);
            this.menu.mount(this.gameContainer);
            // Add overlay styling to menu element
            const menuElement = this.menu.menuElement;
            menuElement.style.position = 'absolute';
            menuElement.style.top = '50%';
            menuElement.style.left = '50%';
            menuElement.style.transform = 'translate(-50%, -50%)';
            menuElement.style.zIndex = '1000';
            menuElement.style.width = '900px';
            menuElement.style.height = '520px';
            menuElement.style.backgroundColor = '#182245';
        }
    }

    private hidePauseOverlay(): void {
        console.log('is this even being triggered?');
        // Unmount menu before removing overlay
        if (this.menu) {
            this.menu.unmount();
            this.menu = null;
        }
    }

    private checkPauseStatus(): void {
        if (this.gameState.status === GameStatus.PAUSED) {
            console.log('paused')
            this.showPauseOverlay();
        } else {
            console.log('play!')
            this.hidePauseOverlay();
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