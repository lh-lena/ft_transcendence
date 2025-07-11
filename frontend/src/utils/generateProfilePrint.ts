export function generateProfilePrint(
    width: number = 40,
    height: number = 40,
    gridSize: number = 2
): { color: string, colorMap: string[] } {
    // define the palette and colors
    const pallete = ['#ff0071', '#ff683e', '#ffbb33', '#ff0000'];
    const color = pallete[Math.floor(Math.random() * pallete.length)];
    const colors = ['white', color];

    // Track if accent color is placed and build color map
    let accentPlaced = false;
    const colorMap: string[] = [];
    const totalSquares = gridSize * gridSize;

    for (let i = 0; i < totalSquares; i++) {
        // Randomly select a color from the predefined list
        const squareColor = colors[Math.floor(Math.random() * colors.length)];
        colorMap.push(squareColor);
        if (squareColor === color) accentPlaced = true;
    }

    // Ensure at least one accent color is placed
    if (!accentPlaced) {
        const randIndex = Math.floor(Math.random() * colorMap.length);
        colorMap[randIndex] = color;
    }

    return { color, colorMap };
}