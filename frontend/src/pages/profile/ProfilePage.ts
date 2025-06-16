import { Router } from '../../router'

export class ProfilePage {
    private container: HTMLElement;

    constructor(private router: Router) {
        this.container = document.createElement('div');
        this.container.className = 'flex flex-col min-h-full gap-3 w-full justify-center items-center';
        
        const header = document.createElement('h1');
        header.textContent = 'Profile';
        this.container.appendChild(header);

        const backButton = document.createElement('button')
        backButton.className = 'btn w-36';
        backButton.textContent = 'back';
        backButton.onclick = () => this.handleBackClick();
        this.container.appendChild(backButton);
    }

    private handleBackClick(): void {
        this.router.navigate('/');
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    public unmount(): void {
        this.container.remove();
    }
}