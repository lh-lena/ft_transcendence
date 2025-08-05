import { PausePlay } from "../pausePlay";
import { GameState } from "../../types";
import { ProfileAvatar } from "../profileAvatar";

export class ScoreBar {
  private element: HTMLElement;
  private playerAContainer: HTMLElement;
  private playerBContainer: HTMLElement;
  private scoreA: HTMLElement;
  private scoreB: HTMLElement;
  private pausePlay: PausePlay;
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.element = document.createElement("div");
    this.element.className =
      "flex flex-row justify-between w-[880px] items-center";

    // Player A profile and score
    this.playerAContainer = document.createElement("div");
    this.playerAContainer.className = "flex flex-row items-center gap-4";
    const profileA = new ProfileAvatar(
      this.gameState.playerA.color,
      this.gameState.playerA.colorMap,
    ).getElement();
    this.playerAContainer.appendChild(profileA);
    this.scoreA = document.createElement("h1");
    this.scoreA.id = "score-a";
    this.scoreA.className = "text-white";
    this.scoreA.textContent = `${this.gameState.playerA.score}`;
    this.playerAContainer.appendChild(this.scoreA);
    this.element.appendChild(this.playerAContainer);

    // Pause/Play button
    this.pausePlay = new PausePlay(this.gameState);
    this.pausePlay.mount(this.element);

    // Player B profile and score
    this.playerBContainer = document.createElement("div");
    this.playerBContainer.className = "flex flex-row items-center gap-4";
    this.scoreB = document.createElement("h1");
    this.scoreB.id = "score-b";
    this.scoreB.textContent = `${this.gameState.playerB.score}`;
    this.scoreB.className = "text-white";
    this.playerBContainer.appendChild(this.scoreB);
    const profileB = new ProfileAvatar(
      this.gameState.playerB.color,
      this.gameState.playerB.colorMap,
    ).getElement();
    this.playerBContainer.appendChild(profileB);
    this.element.appendChild(this.playerBContainer);
  }

  public updateScores(scoreA: number, scoreB: number): void {
    this.scoreA.textContent = `${scoreA}`;
    this.scoreB.textContent = `${scoreB}`;

    // add animation to current winner
    if (scoreA > scoreB) {
      this.playerAContainer.className =
        "flex flex-row items-center gap-4 animate-bounce-slow";
      this.playerBContainer.className = "flex flex-row items-center gap-4";
    } else if (scoreA == scoreB) {
      this.playerAContainer.className = "flex flex-row items-center gap-4";
      this.playerBContainer.className = "flex flex-row items-center gap-4";
    } else {
      this.playerBContainer.className =
        "flex flex-row items-center gap-4 animate-bounce-slow";
      this.playerAContainer.className = "flex flex-row items-center gap-4";
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.element.remove();
  }
}
