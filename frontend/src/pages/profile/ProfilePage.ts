import { Router } from '../../router'
import { Menu } from '../../components/menu'
import { generateProfilePrint } from '../../utils/generateProfilePrint'

export class ProfilePage {
    private container: HTMLElement;
    private menu: Menu;

    constructor(private router: Router) {
        this.container = document.createElement('div');
        this.container.className = 'w-full min-h-full justify-center flex flex-col gap-5 items-center bg-[#0400FF]';

        const fingerprintContainer = document.createElement('div');
        // color is saved as primary color we can use if we like
        const color = generateProfilePrint(fingerprintContainer);
        this.container.appendChild(fingerprintContainer);

        const header = document.createElement('h1');
        header.textContent = 'hi Alec';
        header.className = 'text-white text-2xl'
        this.container.appendChild(header);

        const profileMenu = [
            { name: 'start game', link: '/game' },
            { name: 'log out', link: '/logout'}
        ]
        this.menu = new Menu(this.router, profileMenu);
    }

    

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
        this.menu.mount(this.container);
    }

    public unmount(): void {
        this.container.remove();
    }
}