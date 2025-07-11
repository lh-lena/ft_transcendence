import { generateProfilePrint } from '../../utils/generateProfilePrint';
import { PausePlay } from '../pausePlay';
import { GameState } from '../../types';

export class ScoreBar {
    private element: HTMLElement;
    private scoreA: HTMLElement;
    private scoreB: HTMLElement;
    private pausePlay: PausePlay;

    constructor(private gameState: GameState) {
        this.element = document.createElement('div');
        this.element.className = 'flex flex-row justify-between w-[880px] items-center';

        // Player A profile and score
        const playerAContainer = document.createElement('div');
        playerAContainer.className = 'flex flex-row items-center gap-2';
        const profileA = document.createElement('div');
        generateProfilePrint(profileA);
        playerAContainer.appendChild(profileA);
        this.scoreA = document.createElement('span');
        this.scoreA.id = 'score-a';
        this.scoreA.textContent = `[${this.gameState.playerA.score}]`;
        this.scoreA.style.color = this.gameState.playerA.color;
        playerAContainer.appendChild(this.scoreA);
        this.element.appendChild(playerAContainer);

        // Pause/Play button
        this.pausePlay = new PausePlay();
        this.pausePlay.mount(this.element);

        // Player B profile and score
        const playerBContainer = document.createElement('div');
        playerBContainer.className = 'flex flex-row items-center gap-2';
        const profileB = document.createElement('div');
        generateProfilePrint(profileB);
        playerBContainer.appendChild(profileB);
        this.scoreB = document.createElement('span');
        this.scoreB.id = 'score-b';
        this.scoreB.textContent = `[${this.gameState.playerB.score}]`;
        this.scoreB.style.color = this.gameState.playerB.color;
        playerBContainer.appendChild(this.scoreB);
        this.element.appendChild(playerBContainer);
    }

    public updateScores(scoreA: number, scoreB: number): void {
        this.scoreA.textContent = `[${scoreA}]`;
        this.scoreB.textContent = `[${scoreB}]`;
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }

    public unmount(): void {
        this.element.remove();
    }
}
