export class ScoreBox {
  private element: HTMLElement;

  constructor(playerName: string, result: string) {
    this.element = document.createElement('div');
    this.element.className = 'standard-dialog w-[300px] h-20';

    const title = document.createElement('h1');
    title.className = 'dialog-text';
    title.textContent = playerName;
    this.element.appendChild(title);

    const scoreText = document.createElement('p');
    scoreText.className = 'dialog-text';
    scoreText.innerHTML = `result: <span class="${result === 'win' ? 'text-winGreen' : result === 'loss' ? 'text-lossRed' : ''}">${result}</span>`;
    this.element.appendChild(scoreText);
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.element.remove();
  }
}
