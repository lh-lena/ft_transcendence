// using props because modern approach
export interface SimpleBoxProps {
  title: string;
  subtext: string;
  buttonText: string;
  onButtonClick?: () => void;
  width?: string;
}

export class SimpleBox {
  private element: HTMLElement;

  constructor({ title, subtext, buttonText, onButtonClick, width = '300px' }: SimpleBoxProps) {
        this.element = document.createElement('div');
        this.element.className = 'standard-dialog center scale-down flex flex-col justify-center items-center gap-3';
        this.element.style.width = width;

        const h1 = document.createElement('h1');
        h1.className = 'dialog-text';
        h1.textContent = title;
        this.element.appendChild(h1);

        const p = document.createElement('p');
        p.className = 'dialog-text';
        p.textContent = subtext;
        this.element.appendChild(p);

        const btn = document.createElement('button');
        btn.textContent = buttonText;
        btn.className = 'btn w-36';
        if (onButtonClick) {
        btn.onclick = onButtonClick;
        }
        this.element.appendChild(btn);
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
