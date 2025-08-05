export function generateProfilePrint(gridSize: number = 2): {
  color: string;
  colorMap: string[];
} {
  // define the palette and colors
  const pallete = ["#D72E1D", "#ed623c", "#ffc02e", "#06833e"];
  const color = pallete[Math.floor(Math.random() * pallete.length)];
  const colors = ["white", color];

  // Track if accent color is placed and build color map
  let accentPlaced = false;
  const colorMap: string[] = [];
  const totalSquares = gridSize * gridSize;

  for (let i = 0; i < totalSquares; i++) {
    // Randomly select a color from the predefined list
    const squareColor = colors[Math.floor(Math.random() * colors.length)];
    colorMap.push(squareColor);
    if (squareColor == color) accentPlaced = true;
  }

  // Ensure at least one accent color is placed
  if (!accentPlaced) {
    colorMap[3] = color;
  }

  return { color, colorMap };
}
