export class PongGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private ball: { x: number; y: number; radius: number; rotation: number };
    private animationFrameId: number | null = null;
    private starColor: string = '#0400FF'; // Match CSS variable
    private windowElement: HTMLDivElement;
    
    constructor() {        
        // Create window structure
        this.windowElement = document.createElement('div');
        this.windowElement.className = 'window';
        
        // Create title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'title-bar';
        this.windowElement.appendChild(titleBar);

        const title = document.createElement('h1');
        title.innerText = 'pong';
        title.className = 'title';
        titleBar.appendChild(title);
        
        // Create content area
        const contentArea = document.createElement('div');
        contentArea.className = 'window-content';
        this.windowElement.appendChild(contentArea);

        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.className = ''; // Added border for visibility
        this.canvas.style.backgroundColor = '#ffffff'; 
        
        // Add canvas to the window content area
        contentArea.appendChild(this.canvas);

        // Get context for drawing
        const context = this.canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        this.ctx = context;
        
        // Set initial canvas size
        this.canvas.width = 900;  // Default width
        this.canvas.height = 550; // Default height
        
        // Initialize ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            radius: 8, // Increased size for better visibility
            rotation: 20 // Initial rotation in degrees
        };
        
        console.log('Ball initialized at', this.ball.x, this.ball.y);
    }
    
    private drawStar(x: number, y: number, radius: number, rotation: number): void {
        // ...existing code...
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate((rotation * Math.PI) / 180);
        
        // Draw first square
        this.ctx.fillStyle = this.starColor;
        this.ctx.fillRect(-radius/2, -radius/2, radius, radius);
        
        // Draw second square (rotated 135 degrees)
        this.ctx.rotate((135 * Math.PI) / 180);
        this.ctx.fillRect(-radius/2, -radius/2, radius, radius);
        
        this.ctx.restore();
    }
    
    private draw(): void {
        // ...existing code...
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw star instead of ball
        this.drawStar(
            this.ball.x,
            this.ball.y,
            this.ball.radius * 2, // Multiply by 2 since radius is half the width
            this.ball.rotation
        );
    }
    
    private animate(): void {
        // ...existing code...
        // Make the star rotate for visual effect
        this.ball.rotation += 1;
        
        // Draw the updated scene
        this.draw();
        
        // Continue animation loop
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    public mount(parent: HTMLElement): void {
        // Append the window element instead of just the canvas
        parent.appendChild(this.windowElement);
        this.animate();
    }
    
    public unmount(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.windowElement.remove();
    }
}