export class ProfileAvatar {
  private element: HTMLElement;
  private color: string;
  private colorMap: string[];
  private width: number;
  private height: number;
  private gridSize: number;
  private style?: string | undefined;
  private userId?: string | undefined;

  constructor(
    color: string,
    colorMap: string[],
    width: number = 40,
    height: number = 40,
    gridSize: number = 2,
    style?: string,
    userId?: string,
  ) {
    this.color = color;
    this.colorMap = colorMap;
    this.width = width;
    this.height = height;
    this.gridSize = gridSize;

    this.style = style;
    this.userId = userId;

    this.element = document.createElement("div");
    this.element.style.width = `${width}px`;
    this.element.style.height = `${height}px`;
    this.element.className = "flex items-center justify-center";
    this.init();
  }

  async init() {
    if (this.style && this.style === "image" && this.userId) {
      const img = document.createElement("img");
      img.src = `http://localhost:8080/api/avatar/${this.userId}`;
      img.width = this.width;
      img.height = this.height;
      img.style.objectFit = "cover";
      img.style.border = `2px solid ${this.color}`;
      this.element.appendChild(img);
    }
    // default canvas style
    else {
      this.default();
    }
  }

  private default() {
    const canvas = document.createElement("canvas");
    canvas.width = this.width + 5;
    canvas.height = this.height + 5;
    const ctx = canvas.getContext("2d")!;

    const squareWidth = this.width / this.gridSize;
    const squareHeight = this.height / this.gridSize;

    // draw squares based on colorMap
    let i = 0;
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        ctx.fillStyle = this.colorMap[i] || "white";
        ctx.fillRect(
          x * squareWidth,
          y * squareHeight,
          squareWidth,
          squareHeight,
        );
        i++;
      }
    }

    // draw border around the edge using the primary color
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, this.width - 1, this.height - 1);

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
