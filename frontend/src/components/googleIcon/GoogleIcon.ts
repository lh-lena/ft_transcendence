export class GoogleIcon {
  private main: HTMLElement;

  constructor(onclickCallback?: () => void) {
    // Create the main container div
    this.main = document.createElement("div");
    this.main.className = "information-icon";

    const clickable = document.createElement("a");
    clickable.style.cursor = "pointer";
    if (onclickCallback) clickable.onclick = onclickCallback;

    // Create the SVG element for the Google icon
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute(
      "class",
      "icon icon-tabler icons-tabler-filled icon-tabler-brand-google",
    );

    // First path (background, invisible)
    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path1.setAttribute("stroke", "none");
    path1.setAttribute("d", "M0 0h24v24H0z");
    path1.setAttribute("fill", "none");

    // Second path (Google logo shape)
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path2.setAttribute(
      "d",
      "M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z",
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

  public getNode(): HTMLElement {
    return this.main;
  }

  public className(...styles: string[]): void {
    this.main.classList.add(...styles);
  }
}