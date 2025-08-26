export class CloseIcon {
  private main: HTMLElement;

  constructor(onclickCallback: () => void) {
    // Create the main container div
    this.main = document.createElement("div");
    this.main.className = "information-icon";

    const clickable = document.createElement("a");
    clickable.style.cursor = "pointer";
    clickable.onclick = onclickCallback;

    // Create the SVG element with proper namespace
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute(
      "class",
      "icon icon-tabler icons-tabler-outline icon-tabler-x",
    );

    // Create the first path element (stroke="none" background)
    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path1.setAttribute("stroke", "none");
    path1.setAttribute("d", "M0 0h24v24H0z");
    path1.setAttribute("fill", "none");

    // Create the second path element (first diagonal line)
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path2.setAttribute("d", "M18 6l-12 12");

    // Create the third path element (second diagonal line)
    const path3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path3.setAttribute("d", "M6 6l12 12");

    // Append all paths to the SVG
    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);

    // Append the SVG to the main container
    clickable.appendChild(svg);
    this.main.appendChild(clickable);
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  unmount(): void {
    this.main.remove();
  }

  public className(...styles: string[]): void {
    this.main.classList.add(...styles);
  }
}
