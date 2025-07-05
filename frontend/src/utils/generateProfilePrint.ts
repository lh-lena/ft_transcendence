export function generateProfilePrint(container: HTMLElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
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
        ctx.fillStyle = color;

        // Draw a 5x5 square at the current grid position
        ctx.fillRect(x * 20, y * 20, 20, 20);
        }
    }

    // Append the canvas to the provided container
    container.appendChild(canvas);
    return color;
}