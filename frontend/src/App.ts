import { GameStatus } from './types/game'
import { Menu } from './components/Menu'

export class App {
    private element: HTMLElement;
    private gameState: GameStatus = GameStatus.MENU;

    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'app';
        this.element.className = 'sys-window w-full h-full';
        this.initializeApp();
    }

    private initializeApp(): void {
        // create header component and import it here tbh
        // const header = document.createElement('header');
        // header.className = 'p-4 flex flex-row';
        // header.textContent = 'ft_transcendence';

        const main = document.createElement('main');
        main.className = 'p-4 sys-app h-full';

        const menu = new Menu();
        menu.mount(main);

        // this.element.appendChild(header);
        this.element.appendChild(main);
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.element);
    }
}