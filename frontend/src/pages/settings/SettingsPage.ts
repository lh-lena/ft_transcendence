import { Router } from '../../router'
import { CANVAS_DEFAULTS } from '../../types'
import { Window } from '../../components/window'

// TODO-BACKEND
import { userStore } from '../../types'

export class SettingsPage {
    private container: HTMLElement;

    constructor(private router: Router) {
        // Full page background
        this.container = document.createElement('div');
        this.container.className = 'w-full min-h-screen flex items-center justify-center bg-brandBlue';

        // Window content

        const windowComponent = new Window({
            title: 'Settings',
            width: CANVAS_DEFAULTS.width,
            height: CANVAS_DEFAULTS.height,
            className: '',
            children: []
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