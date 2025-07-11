export class PongButton {
    private element: HTMLElement;

    constructor() {
        this.element = document.createElement('div');

        const homeButton = document.createElement('a');
        homeButton.href = '/';
        this.element.appendChild(homeButton);

        const title = document.createElement('h1'); // Use an <h1> element for styling
        title.className = 'title text-white text-3xl hover:text-[#4D4DFF] transition-colors duration-300';
        title.innerText = 'pong';
        homeButton.appendChild(title); // Append the styled <h1> inside the <a>
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }

    setBounce(): void {
        this.element.className = 'animate-bounce-slow';
    }
}