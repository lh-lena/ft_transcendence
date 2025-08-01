import { Router } from '../../router'
import { CANVAS_DEFAULTS } from '../../types'
import { Window } from '../../components/window'
import { MenuBar } from '../../components/menuBar'

const settingButtons = [
  'this',
  'that',
  'another',
  'that',
  'other',
];

export class SettingsPage {
    private container: HTMLElement;

    constructor(private router: Router) {
        // Full page background
        this.container = document.createElement('div');
        this.container.className = 'w-full min-h-screen flex items-center justify-center bg-brandBlue';

        // Window content

        const buttonRow = document.createElement('div');
        buttonRow.className = 'flex flex-row gap-3';

        settingButtons.forEach((btnText, idx) => {
          const button = document.createElement('button');
          button.className = 'btn flex items-center justify-center w-24';
          if (idx === 0) button.classList.add('btn-default');
          button.textContent = btnText;
          buttonRow.appendChild(button);
        });

        const menuBar = new MenuBar(router, 'settings');

        const windowComponent = new Window({
            title: 'Settings',
            width: CANVAS_DEFAULTS.width,
            height: CANVAS_DEFAULTS.height,
            className: '',
            children: [menuBar.render(), buttonRow]
        });
        this.container.appendChild(windowComponent.getElement());
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    public unmount(): void {
        this.container.remove();
    }
}