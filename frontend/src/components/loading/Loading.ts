export class Loading {
  private element: HTMLElement;

  constructor(
    private waitingString: string,
    private style?: string,
    private buttonCallBack?: () => void,
  ) {
    this.element = document.createElement('div');
    this.element.id = 'loading';
    this.element.className =
      'fixed top-0 left-0 w-screen h-screen flex flex-col gap-5 justify-center items-center bg-[#0400FF] z-50';

    const title = document.createElement('h1');
    title.className = 'title text-white text-3xl animate-pulse';
    title.textContent = this.waitingString;
    this.element.appendChild(title);

    if (this.style && this.style == 'button') {
      const backButton = document.createElement('button');
      backButton.className = 'btn flex items-center justify-center w-8 h-8 bg-[#0400FF]';
      backButton.innerText = 'x';
      if (this.buttonCallBack) {
        backButton.onclick = this.buttonCallBack;
      }
      this.element.appendChild(backButton);
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  mount(parent: HTMLElement): void {
    if (!this.element.parentNode) {
      parent.appendChild(this.element);
    }
  }

  hide(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  show(): void {
    this.element.style.display = 'flex';
  }
}
