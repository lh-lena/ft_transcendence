import { PausePlay } from "../pausePlay";
import { GameState } from "../../types";
import { ProfileAvatar } from "../profileAvatar";
import { Player } from "../../types";

export class ScoreBar {
  private element: HTMLElement;
  private playerLeftContainer: HTMLElement;
  private playerRightContainer: HTMLElement;
  private scoreA: HTMLElement;
  private scoreB: HTMLElement;
  public pausePlay: PausePlay;
  private gameState: GameState;
  private gameStateCallbackParent: () => void;

  constructor(gameState: GameState, gameStateCallbackParent: () => void) {
    this.gameState = gameState;
    this.gameStateCallbackParent = gameStateCallbackParent;
    let playerLeft: Player;
    let playerRight: Player;
    if (this.gameState.activePaddle == "paddleA") {
      playerLeft = this.gameState.playerA;
      playerRight = this.gameState.playerB;
    } else {
      playerLeft = this.gameState.playerB;
      playerRight = this.gameState.playerA;
    }
    this.element = document.createElement("div");
    this.element.className =
      "flex flex-row justify-between w-[880px] items-center";

    // Player A profile and score
    this.playerLeftContainer = document.createElement("div");
    this.playerLeftContainer.className = "flex flex-row items-center gap-4";
    const profileA = new ProfileAvatar(
      playerLeft.color,
      playerLeft.colorMap,
    ).getElement();
    this.playerLeftContainer.appendChild(profileA);
    this.scoreA = document.createElement("h1");
    this.scoreA.id = "score-a";
    this.scoreA.className = "text-white";
    this.scoreA.textContent = `${this.gameState.playerA.score}`;
    this.playerLeftContainer.appendChild(this.scoreA);
    this.element.appendChild(this.playerLeftContainer);

    // Pause/Play button
    this.pausePlay = new PausePlay(this.gameState, () =>
      this.gameStateCallbackParent(),
    );
    this.pausePlay.mount(this.element);

    // Player B profile and score
    this.playerRightContainer = document.createElement("div");
    this.playerRightContainer.className = "flex flex-row items-center gap-4";
    this.scoreB = document.createElement("h1");
    this.scoreB.id = "score-b";
    this.scoreB.textContent = `${this.gameState.playerB.score}`;
    this.scoreB.className = "text-white";
    this.playerRightContainer.appendChild(this.scoreB);
    const profileB = new ProfileAvatar(
      playerRight.color,
      playerRight.colorMap,
    ).getElement();
    this.playerRightContainer.appendChild(profileB);
    this.element.appendChild(this.playerRightContainer);
  }

  public updateScores(scoreA: number, scoreB: number): void {
    this.scoreA.textContent = `${scoreA}`;
    this.scoreB.textContent = `${scoreB}`;

    // add animation to current winner
    if (scoreA > scoreB) {
      this.playerLeftContainer.className =
        "flex flex-row items-center gap-4 animate-bounce-slow";
      this.playerRightContainer.className = "flex flex-row items-center gap-4";
    } else if (scoreA == scoreB) {
      this.playerLeftContainer.className = "flex flex-row items-center gap-4";
      this.playerRightContainer.className = "flex flex-row items-center gap-4";
    } else {
      this.playerRightContainer.className =
        "flex flex-row items-center gap-4 animate-bounce-slow";
      this.playerLeftContainer.className = "flex flex-row items-center gap-4";
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.element.remove();
  }
}
