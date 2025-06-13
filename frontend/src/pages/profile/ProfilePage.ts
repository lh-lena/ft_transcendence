export class ProfilePage {
    private container: HTMLElement;

    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'flex flex-col min-h-full w-full justify-center items-center';
        
        const header = document.createElement('h1');
        header.textContent = 'Profile';
        this.container.appendChild(header);
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    public unmount(): void {
        this.container.remove();
    }
}