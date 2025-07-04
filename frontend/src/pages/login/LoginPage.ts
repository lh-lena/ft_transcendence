import { Router } from '../../router'
import { Menu } from '../../components/menu';

export class LoginPage {
    private main: HTMLElement;
    private menu: Menu;

    constructor(private router: Router) {
        this.main = document.createElement('div');
        this.main.className = 'flex w-full min-h-full justify-center items-center bg-[#0400FF]';

        const form = document.createElement('form');
        form.className = 'flex flex-col gap-3';
        this.main.appendChild(form);
        
        // div email
        const divEmail = document.createElement('div');
        divEmail.className = 'flex flex-col';
        form.appendChild(divEmail);

        // email label
        const labelEmail = document.createElement('label');
        labelEmail.htmlFor = 'text_email';
        labelEmail.innerText = 'Email';
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
        divPassword.appendChild(labelPassword);

        // password input
        const inputPassword = document.createElement('input');
        inputPassword.type = 'password';
        inputPassword.id = 'text_password';
        inputPassword.placeholder = 'password';
        divPassword.appendChild(inputPassword);

        const loginMenu = [
            // obv will be changing this to /loginAuth for logins
            { name: 'log in', link: '/profile' },
            { name: 'register', link: '/register' }
        ];

        this.menu = new Menu(this.router, loginMenu);
    }

    public mount(parent: HTMLElement): void {
        this.menu.mount(this.main);
        parent.appendChild(this.main);
    }


    public unmount(): void {
        this.main.remove();
    }
}