export interface WindowProps {
  title: string;
  width?: number;
  height?: number;
  className?: string;
  children?: HTMLElement[];
}

export class Window {
  private element: HTMLElement;
  private windowPane: HTMLElement;

  constructor({ title, width = 950, height = 550, className = '', children = [] }: WindowProps) {
    this.element = document.createElement('div');
    this.element.className = `window flex flex-col ${className}`;
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.element.style.maxWidth = '100vw';
    this.element.style.maxHeight = '100vh';
    this.element.style.margin = 'auto';
    this.element.style.boxSizing = 'border-box';

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'title-bar';
    const titleElem = document.createElement('h1');
    titleElem.className = 'title';
    titleElem.textContent = title;
    titleBar.appendChild(titleElem);
    this.element.appendChild(titleBar);

    // Separator
    const separator = document.createElement('div');
    separator.className = 'separator';
    this.element.appendChild(separator);

    // Window pane
    this.windowPane = document.createElement('div');
    this.windowPane.className = 'window-pane w-full h-full flex flex-col gap-8 items-center';
    this.element.appendChild(this.windowPane);

    // Add children
    children.forEach((child) => {
      this.windowPane.appendChild(child);
    });
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getPane(): HTMLElement {
    return this.windowPane;
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.element.remove();
  }
}
