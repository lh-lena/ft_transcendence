export class HomeIcon {
  private main: HTMLElement;

  constructor(onclickCallback: () => void) {
    // Create the main container div
    this.main = document.createElement("div");
    this.main.className = "information-icon";

    const clickable = document.createElement("a");
    clickable.style.cursor = "pointer";
    clickable.onclick = onclickCallback;

    // Create the SVG element for the filled home icon
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute(
      "class",
      "icon icon-tabler icons-tabler-filled icon-tabler-home"
    );

    // First path (background, invisible)
    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path1.setAttribute("stroke", "none");
    path1.setAttribute("d", "M0 0h24v24H0z");
    path1.setAttribute("fill", "none");

    // Second path (actual home shape)
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path2.setAttribute(
      "d",
      "M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-1v-7a3 3 0 0 0 -2.824 -2.995l-.176 -.005h-2a3 3 0 0 0 -3 3v7h-1a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.293 11.707a1 1 0 0 1 1 1v7h-4v-7a1 1 0 0 1 .883 -.993l.117 -.007z"
    );

    svg.appendChild(path1);
    svg.appendChild(path2);
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
