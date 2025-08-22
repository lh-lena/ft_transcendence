import { Router } from '../../router';

export interface MenuItem {
  name: string; // Button text
  link?: string; // optional URL link
  onClick?: () => void; // optional custom callback
  style?: string;
}

// MACROS AND SHORTCUTS
// '//back' always routes to the previous page using router
// style: tiny, default is large

export class Menu {
  private element: HTMLElement;

  constructor(
    private router: Router,
    private menuItems: MenuItem[],
  ) {
    this.element = document.createElement('div');
    this.element.className =
      'sys-window flex flex-col items-center justify-center w-full h-full gap-5';
    this.createMenuContent();
  }

  get menuElement(): HTMLElement {
    return this.element;
  }

  private createMenuContent(): void {
    this.menuItems.forEach((item) => {
      const button = document.createElement('button');
      button.className = 'btn w-36';
      if (item.style == 'tiny')
        button.className = 'btn flex items-center justify-center w-8 h-8 bg-brandBlue';
      button.textContent = item.name;
      if (item.onClick) {
        button.onclick = item.onClick;
      } else if (item.link === '//back') {
        button.onclick = () => this.router.navigateBack();
      } else if (item.link) {
        button.onclick = () => this.router.navigate(item.link ?? '/');
      }
      this.element.appendChild(button);
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
