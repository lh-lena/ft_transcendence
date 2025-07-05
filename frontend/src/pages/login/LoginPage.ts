import { Router } from '../../router'
import { Menu } from '../../components/menu';
import { PongButton } from '../../components/pongButton'

export class LoginPage {
    private main: HTMLElement;
    private menu: Menu;
    private pongButton: PongButton;

    constructor(private router: Router) {
        this.main = document.createElement('div');
        this.main.className = 'flex flex-col w-full min-h-full gap-5 justify-center text-xl items-center bg-[#0400FF]';

        this.pongButton = new PongButton();
        this.pongButton.mount(this.main);

        const form = document.createElement('form');
        form.className = 'flex flex-col gap-3';
        this.main.appendChild(form);
        
        // div email
        const divEmail = document.createElement('div');
        divEmail.className = 'flex flex-col w-64';
        form.appendChild(divEmail);

        // email label
        const labelEmail = document.createElement('label');
        labelEmail.htmlFor = 'text_email';
        labelEmail.innerText = 'Email';
        labelEmail.className = 'text-white';
        divEmail.appendChild(labelEmail);

        // email input
        const inputEmail = document.createElement('input');
        inputEmail.type = 'email';
        inputEmail.id = 'text_email';
        inputEmail.placeholder = 'pong@email.com';
        divEmail.appendChild(inputEmail);

        // div password
        const divPassword = document.createElement('div');
        divPassword.className = 'flex flex-col';
        form.appendChild(divPassword);

        // password label
        const labelPassword = document.createElement('label');
        labelPassword.htmlFor = 'text_password';
        labelPassword.innerText = 'Password';
        labelPassword.className = 'text-white';
        divPassword.appendChild(labelPassword);

        // password input
        const inputPassword = document.createElement('input');
        inputPassword.type = 'password';
        inputPassword.id = 'text_password';
        inputPassword.placeholder = 'password';
        divPassword.appendChild(inputPassword);

        const loginMenu = [
            // obv will be changing this to /loginAuth for logins
            { name: 'log in', link: '/profile' }
            // slash slash back is a quick and sweet little previous page match in menu
            // { name: 'back', link: '//back' }
        ];
        this.menu = new Menu(this.router, loginMenu);
        this.menu.mount(this.main);
    }

    public mount(parent: HTMLElement): void {
        parent.appendChild(this.main);
    }


    public unmount(): void {
        this.main.remove();
    }
}