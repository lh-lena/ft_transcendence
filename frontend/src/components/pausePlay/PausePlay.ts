import { GameState, GameStatus } from "../../types";

export class PausePlay {
  private button: HTMLButtonElement;
  private gameState: GameState;
  private gameStateCallbackParent: () => void;

  constructor(gameState: GameState, gameStateCallbackParent: () => void) {
    this.gameStateCallbackParent = gameStateCallbackParent;
    this.gameState = gameState;
    this.button = document.createElement("button");
    this.button.className =
      "btn flex items-center justify-center w-8 h-8 bg-white duration-150";
    this.renderIcon();
    this.button.addEventListener("click", () => {
      this.gameState.status =
        this.gameState.status === GameStatus.PLAYING
          ? GameStatus.PAUSED
          : GameStatus.PLAYING;
      this.gameStateCallbackParent();
      this.renderIcon();
    });
  }

  private renderIcon() {
    this.button.innerHTML = "";
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.style.fontSize = "2rem";
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";
    icon.innerHTML =
      this.gameState.status === GameStatus.PAUSED
        ? this.playSVG()
        : this.pauseSVG();
    this.button.appendChild(icon);
  }

  public toggleIsPlaying(bool: boolean): void {
    this.gameState.status = bool ? GameStatus.PLAYING : GameStatus.PAUSED;
    this.renderIcon();
  }

  private playSVG(): string {
    // Play icon SVG
    return `<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="8,6 26,16 8,26" fill="#000"/></svg>`;
  }

  private pauseSVG(): string {
    // Pause icon SVG
    return `<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="5" height="20" fill="#000"/><rect x="19" y="6" width="5" height="20" fill="#000"/></svg>`;
  }

  public mount(parent: HTMLElement) {
    parent.appendChild(this.button);
  }

  public unmount() {
    this.button.remove();
  }
}
