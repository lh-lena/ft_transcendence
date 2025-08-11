export class Countdown {
  private element: HTMLElement;
  private digit: number;

  constructor() {
    this.digit = 3; // Start countdown from 5
    this.element = document.createElement('div');
    this.element.id = 'countdown';
    this.element.className = 'flex min-h-full w-full justify-center items-center bg-[#0400FF]';

    const title = document.createElement('h1');
    title.className = 'title text-white text-3xl';
    title.textContent = `${this.digit}`;
    this.element.appendChild(title);
  }

  public start(callback: () => void): void {
    const title = this.element.querySelector('h1') as HTMLElement;
    const interval = setInterval(() => {
      this.digit -= 1;
      title.textContent = `${this.digit}`;
      if (this.digit <= 0) {
        clearInterval(interval);
        title.textContent = 'go!';
        setTimeout(() => {
          this.hide(); // Hide countdown
          callback(); // Execute callback
        }, 1000); // Delay before starting the game
      }
    }, 1000);
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public hide(): void {
    this.element.style.display = 'none';
  }

  public show(): void {
    this.element.style.display = 'flex';
  }
}
