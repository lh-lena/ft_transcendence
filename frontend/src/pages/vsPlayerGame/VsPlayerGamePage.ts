import { Router } from '../../router';
import { PongGame } from '../../game';
//import { Countdown } from '../../components/countdown'
import { GameState, GameStatus } from '../../types'
import { ScoreBar } from '../../components/scoreBar'
import { generateProfilePrint } from '../../utils/generateProfilePrint'

import { Menu } from '../../components/menu'

// TODO-BACKEND switch out for backend data cached on merge
import { userStore } from '../../constants/backend'

// web socket
// import { WsServerBroadcast, WsClientMessage } from '../../types/websocket';
// import { websocketUrl } from '../../constants/websocket';

export class VsPlayerGamePage {
    private element: HTMLElement;
    private game: PongGame | null = null;
    private gameState: GameState;
    // private countdown: Countdown;
    private scoreBar!: ScoreBar;
    private menu: Menu | null = null;
    private gameContainer: HTMLElement | null = null;
    private websocket: WebSocket | null = null;

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

        // initialize web socket
        // this.initializeWebSocket();
        // initialize game
        this.initializeGame();

        // Initialize Countdown
        // this.countdown = new Countdown();
        // Mount Countdown
        // this.countdown.mount(this.element);
        // Start Countdown and proceed to game after it finishes
        // this.countdown.start(() => {
             // Initialize game after countdown
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

    }

    private showPauseOverlay(): void {
        this.game?.hideGamePieces();
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
        }
    }

    private hidePauseOverlay(): void {
        this.game?.showGamePieces();
        // Unmount menu before removing overlay
        if (this.menu) {
            this.menu.unmount();
            this.menu = null;
        }
    }

    private checkPauseStatus(): void {
        if (this.gameState.status === GameStatus.PAUSED) {
            this.showPauseOverlay();
        } else {
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

    // // web socket
    // private initializeWebSocket(): void {
    //     const DEVMODE = true;
        
    //     const wsUrl = websocketUrl;

    //     if (DEVMODE)
    //         this.websocket = new MockWebSocket(wsUrl) as any;
    //     else
    //         this.websocket = new WebSocket(wsUrl);

    //     this.websocket.onopen = () => {
    //         console.log('WebSocket connected');
    //         // Send initial connection message
    //         this.sendMessage({
    //             'game_start': { gameId: 'your-game-id-here' }
    //         });
    //     };

    //     this.websocket.onmessage = (event) => {
    //         try {
    //             const data = JSON.parse(event.data);
    //             this.handleWebSocketMessage(data);
    //         } catch (error) {
    //             console.error('Error parsing WebSocket message:', error);
    //         }
    //     };

    //     this.websocket.onclose = (event) => {
    //         console.log('WebSocket connection closed:', event.code, event.reason);
    //         // Optionally implement reconnection logic here
    //     };

    //     this.websocket.onerror = (error) => {
    //         console.error('WebSocket error:', error);
    //     };
    // }

    // private sendMessage<K extends keyof WsClientMessage>(
    //     payload: WsClientMessage[K]
    // ): void {
    //     if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
    //         const message = { event, payload };
    //         this.websocket.send(JSON.stringify(message));
    //     } else {
    //         console.warn('WebSocket is not open. Message not sent:', { event, payload });
    //     }
    // }

    // // Handle incoming WebSocket messages
    // private handleWebSocketMessage(data: WsServerBroadcast): void {
    //     // Implement your logic here to handle different message types
    //     console.log('Received WebSocket message:', data);
    //     // Example: update game state, scores, etc. based on data
    // }

}