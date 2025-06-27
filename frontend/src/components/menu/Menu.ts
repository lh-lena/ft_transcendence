import { Router } from '../../router';

type MenuItem = {
  name: string; // Button text
  link: string; // URL link
};

export class Menu {
  private element: HTMLElement;

  constructor(private router: Router, private menuItems: MenuItem[]) {
    this.element = document.createElement('div');
    this.element.className = 'sys-window flex flex-col items-center justify-center w-full h-full gap-5';
    this.createMenuContent();
  }

  private createMenuContent(): void {

    // Dynamically create buttons based on menuItems
    this.menuItems.forEach((item) => {
      const button = document.createElement('button');
      button.className = 'btn w-36';
      button.textContent = item.name;
      button.onclick = () => this.router.navigate(item.link);
      this.element.appendChild(button);
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }
}