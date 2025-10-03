export class Loading {
  private element: HTMLElement;
  private title: HTMLElement;
  private backButton?: HTMLElement;
  private mouseMoveHandler?: (event: MouseEvent) => void;
  private hideTimeout?: number;

  constructor(
    waitingString: string,
    style?: string,
    buttonCallBack?: () => void,
  ) {
    this.element = document.createElement("div");
    this.element.id = "loading";
    this.element.className =
      "fixed top-0 left-0 w-screen h-screen flex flex-col gap-5 justify-center items-center bg-[#0400FF] z-50 relative";

    this.title = document.createElement("h1");
    this.title.className = "title text-white text-3xl animate-pulse";
    this.title.textContent = waitingString;
    this.element.appendChild(this.title);

    if (style && style == "button") {
      this.backButton = document.createElement("button");
      this.backButton.className =
        "btn flex items-center justify-center w-8 h-8 opacity-0 transition-opacity mt-10 duration-300";
      this.backButton.style.opacity = "0";
      this.backButton.style.pointerEvents = "auto";
      this.backButton.innerText = "x";
      if (buttonCallBack) {
        this.backButton.onclick = buttonCallBack;
      }
      this.element.appendChild(this.backButton);

      // Set up mouse move handler
      this.mouseMoveHandler = (event: MouseEvent) => {
        if (this.backButton) {
          // Clear any existing timeout
          if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
          }
          // Show button
          this.backButton.style.opacity = "1";
          // Hide button after 3 seconds of no mouse movement
          this.hideTimeout = window.setTimeout(() => {
            if (this.backButton) {
              this.backButton.style.opacity = "0";
            }
          }, 3000);
        }
      };
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public changeText(newText: string): void {
    this.title.classList.remove("animate-pulse");
    this.title.innerText = newText;
    // Re-add animation after a brief delay
    setTimeout(() => {
      this.title.classList.add("animate-pulse");
    }, 100);
  }

  mount(parent: HTMLElement): void {
    if (!this.element.parentNode) {
      parent.appendChild(this.element);
      // Add mouse move listener when mounted with a slight delay
      if (this.mouseMoveHandler) {
        setTimeout(() => {
          document.addEventListener("mousemove", this.mouseMoveHandler!);
          // Test if it works immediately
          setTimeout(() => {
            if (this.backButton) {
              this.backButton.style.opacity = "1";
              setTimeout(() => {
                this.backButton!.style.opacity = "0";
              }, 2000);
            }
          }, 1000);
        }, 100);
      }
    }
  }

  hide(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      // Remove mouse move listener when hidden
      if (this.mouseMoveHandler) {
        document.removeEventListener("mousemove", this.mouseMoveHandler);
      }
      // Clear timeout
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
    }
  }

  show(): void {
    this.element.style.display = "flex";
  }

  unmount(): void {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      // Remove mouse move listener when unmounted
      if (this.mouseMoveHandler) {
        document.removeEventListener("mousemove", this.mouseMoveHandler);
      }
      // Clear timeout
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = undefined;
      }
    }
  }

  // ...existing code...
}
