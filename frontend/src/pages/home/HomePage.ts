import { Menu } from '../../components/menu';
import { Router } from '../../router'

export class HomePage {
    private element: HTMLElement;
    private menu: Menu;

    constructor(private router: Router) {
        this.element = document.createElement('div');
        this.element.className = 'flex w-full min-h-full justify-center items-center bg-[#0400FF]';
        this.menu = new Menu(this.router);
    }

    public mount(parent: HTMLElement): void {
        this.menu.mount(this.element);
        parent.appendChild(this.element);
    }

    public unmount(): void {
        this.element.remove();
    }
}