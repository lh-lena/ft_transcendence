export class ProfileAvatar {
    private element: HTMLElement;

    constructor(
        private color: string,
        private colorMap: string[],
        private width: number = 40,
        private height: number = 40,
        private gridSize: number = 2,
        private style?: string
    ) {
        this.element = document.createElement('div');
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;
        this.element.className = 'flex items-center justify-center';

        const canvas = document.createElement('canvas');
        canvas.width = width + 5;
        canvas.height = height + 5;
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

        // Draw border around the edge using the primary color
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, width - 1, height - 1);
    
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