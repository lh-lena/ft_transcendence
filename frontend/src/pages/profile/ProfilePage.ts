import { Router } from '../../router'
import { Menu } from '../../components/menu'

export class ProfilePage {
    private container: HTMLElement;
    private menu: Menu;

    constructor(private router: Router) {
        this.container = document.createElement('div');
        this.container.className = 'w-full min-h-full justify-center flex flex-col gap-5 items-center bg-[#0400FF]';

        const fingerprintContainer = document.createElement('div');
        fingerprintContainer.className = 'mt-5';
        this.generateProfileFingerprint(fingerprintContainer);
        this.container.appendChild(fingerprintContainer);

        const header = document.createElement('h1');
        header.textContent = 'hi Alec';
        header.className = 'text-white text-3xl'
        this.container.appendChild(header);

        const profileMenu = [
            { name: 'start game', link: '/game' },
        ]
        this.menu = new Menu(this.router, profileMenu);
    }

    private generateProfileFingerprint(container: HTMLElement): void {
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext('2d')!;
        
        // Define the five colors to use
        const pallete = ['#ff0071', '#ff683e', '#ffbb33', '#ff0000'];
        const color = pallete[Math.floor(Math.random() * pallete.length)];
        const colors = ['white', color];

        // Loop through the 10x10 grid (50x50 divided into 5x5 blocks)
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
            // Randomly select a color from the predefined list
            const color = colors[Math.floor(Math.random() * colors.length)];
            console.log(color);
            ctx.fillStyle = color;

            // Draw a 5x5 square at the current grid position
            ctx.fillRect(x * 20, y * 20, 20, 20);
            }
        }

        // Append the canvas to the provided container
        container.appendChild(canvas);
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
        this.menu.mount(this.container);
    }

    public unmount(): void {
        this.container.remove();
    }
}