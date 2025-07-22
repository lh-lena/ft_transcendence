export class ProfileAvatar {
    private element: HTMLElement;

    constructor(
        private colorMap: string[],
        private width: number = 40,
        private height: number = 40,
        private gridSize: number = 2,
        private style?: string
    ) {
        this.element = document.createElement('div');
        this.element.style.width = `${width + 5}px`;
        this.element.style.height = `${height + 5}px`;
        this.element.className = 'bg-white flex items-center justify-center';

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        const squareWidth = width / gridSize;
        const squareHeight = height / gridSize;

        // Draw squares based on colorMap
        let i = 0;
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                ctx.fillStyle = this.colorMap[i] || 'white';
                ctx.fillRect(x * squareWidth, y * squareHeight, squareWidth, squareHeight);
                i++;
            }
        }
    
        this.element.appendChild(canvas);
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public unmount(): void {
        this.element.remove();
    }
}