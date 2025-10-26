export class FriendsIcon {
  private main: HTMLElement;

  constructor(onclickCallback?: () => void) {
    // Create the main container div
    this.main = document.createElement("div");
    this.main.className = "information-icon";

    const clickable = document.createElement("a");
    clickable.style.cursor = "pointer";
    if (onclickCallback) clickable.onclick = onclickCallback;

    // Create the SVG element for the outline users/friends icon
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
      "icon icon-tabler icons-tabler-outline icon-tabler-users",
    );

    // First path (background, invisible)
    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path1.setAttribute("stroke", "none");
    path1.setAttribute("d", "M0 0h24v24H0z");
    path1.setAttribute("fill", "none");

    // Second path (main user circle)
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path2.setAttribute("d", "M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0");

    // Third path (main user base)
    const path3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path3.setAttribute("d", "M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2");

    // Fourth path (side user circle)
    const path4 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path4.setAttribute("d", "M16 3.13a4 4 0 0 1 0 7.75");

    // Fifth path (side user base)
    const path5 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path5.setAttribute("d", "M21 21v-2a4 4 0 0 0 -3 -3.85");

    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);
    svg.appendChild(path4);
    svg.appendChild(path5);
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
