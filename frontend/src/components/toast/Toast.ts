export interface ToastOptions {
  title?: string;
  message: string;
  duration?: number;
  type?: "info" | "success" | "warning" | "error";
}

export class Toast {
  private element: HTMLElement;
  private timeout: number | null = null;

  constructor({
    title,
    message,
    duration = 4000,
    type = "info",
  }: ToastOptions) {
    this.element = this.createElement(title, message, type);
    this.startAutoRemove(duration);
  }

  private createElement(
    title: string | undefined,
    message: string,
    type: string,
  ): HTMLElement {
    const toast = document.createElement("div");
    toast.className = "standard-dialog center scale-down toast-item";
    toast.style.cssText = `
      width: 30rem;
      max-width: 90vw;
      position: relative;
      margin-bottom: 1rem;
      animation: toastSlideIn 0.3s ease-out;
      z-index: 10000;
    `;

    // Add type-specific styling
    const typeColors = {
      info: "#000000",
      success: "#006400",
      warning: "#FF8C00",
      error: "#DC143C",
    };

    const content = document.createElement("div");
    content.style.color =
      typeColors[type as keyof typeof typeColors] || typeColors.info;

    if (title) {
      const titleElement = document.createElement("h1");
      titleElement.className = "dialog-text";
      titleElement.textContent = title;
      content.appendChild(titleElement);
    }

    const messageElement = document.createElement("p");
    messageElement.className = "dialog-text";
    messageElement.textContent = message;
    content.appendChild(messageElement);

    toast.appendChild(content);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "×";
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: inherit;
      font-family: inherit;
    `;
    closeButton.onclick = () => this.remove();
    toast.appendChild(closeButton);

    return toast;
  }

  private startAutoRemove(duration: number): void {
    this.timeout = setTimeout(() => {
      this.remove();
    }, duration);
  }

  public remove(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.element.style.animation = "toastSlideOut 0.3s ease-in forwards";
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 300);
  }

  public getElement(): HTMLElement {
    return this.element;
  }
}

class ToastManager {
  private container: HTMLElement;
  private toasts: Toast[] = [];

  constructor() {
    this.container = this.createContainer();
    this.injectStyles();
  }

  private createContainer(): HTMLElement {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText = `
        position: fixed;
        top: 2rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    return container;
  }

  private injectStyles(): void {
    if (document.getElementById("toast-styles")) return;

    const styles = document.createElement("style");
    styles.id = "toast-styles";
    styles.textContent = `
      @keyframes toastSlideIn {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes toastSlideOut {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-100%);
          opacity: 0;
        }
      }

      .toast-item {
        pointer-events: auto;
      }

      .toast-item:hover {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(styles);
  }

  public show(options: ToastOptions): Toast {
    const toast = new Toast(options);
    this.toasts.push(toast);
    this.container.appendChild(toast.getElement());

    // Remove from array when toast is removed
    const originalRemove = toast.remove.bind(toast);
    toast.remove = () => {
      const index = this.toasts.indexOf(toast);
      if (index > -1) {
        this.toasts.splice(index, 1);
      }
      originalRemove();
    };

    return toast;
  }

  public clear(): void {
    this.toasts.forEach((toast) => toast.remove());
    this.toasts = [];
  }

  // Convenience methods
  public info(message: string, title?: string, duration?: number): Toast {
    return this.show({ message, title, duration, type: "info" });
  }

  public success(message: string, title?: string, duration?: number): Toast {
    return this.show({ message, title, duration, type: "success" });
  }

  public warning(message: string, title?: string, duration?: number): Toast {
    return this.show({ message, title, duration, type: "warning" });
  }

  public error(message: string, title?: string, duration?: number): Toast {
    return this.show({ message, title, duration, type: "error" });
  }
}

// Export a singleton instance for easy use
export const toastManager = new ToastManager();

// Export convenience functions
export const showToast = (options: ToastOptions): Toast =>
  toastManager.show(options);
export const showInfo = (
  message: string,
  title?: string,
  duration?: number,
): Toast => toastManager.info(message, title, duration);
export const showSuccess = (
  message: string,
  title?: string,
  duration?: number,
): Toast => toastManager.success(message, title, duration);
export const showWarning = (
  message: string,
  title?: string,
  duration?: number,
): Toast => toastManager.warning(message, title, duration);
export const showError = (
  message: string,
  title?: string,
  duration?: number,
): Toast => toastManager.error(message, title, duration);
export const clearToasts = (): void => toastManager.clear();
