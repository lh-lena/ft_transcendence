export class Loading {
    private element: HTMLElement;

    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'loading';
        this.element.className = 'flex min-h-full w-full justify-center items-center';
        
        const heading = document.createElement('h1');
        heading.className = 'animate-pulse text-xl sys-text';
        heading.textContent = 'loading';
        
        this.element.appendChild(heading);
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }

    hide(): void {
        this.element.style.display = 'none';
    }

    show(): void {
        this.element.style.display = 'flex';
    }
}