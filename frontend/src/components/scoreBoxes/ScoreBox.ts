export class ScoreBox {
  private element: HTMLElement;

  constructor(playerName: string, score: number, result?: string){
    this.element = document.createElement('div');
    this.element.className = 'standard-dialog center scale-down w-[300px]';

    const title = document.createElement('h1');
    title.className = 'dialog-text';
    title.textContent = playerName;
    this.element.appendChild(title);

    const scoreText = document.createElement('p');
    scoreText.className = 'dialog-text';
    if (result)
        scoreText.textContent = `Result: ${result}`;
    else
        scoreText.textContent = `Score: ${score}`;
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
