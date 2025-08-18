import { Router } from '../../router';

export interface MenuBarItem {
  label: string;
  items?: Array<{
    label: string;
    href?: string;
    divider?: boolean;
    style?: string;
  }>;
  href?: string;
  style?: string;
}

export class MenuBar {
  router: Router;
  menuBarItems: MenuBarItem[];

  static defaultMenuBarItems: MenuBarItem[] = [
    {
      label: 'start Game',
      items: [
        { label: 'Local Game', href: '/local' },
        { label: 'Vs AI', href: '/vs-ai' },
        { label: 'Vs Player', href: '/vs-player' },
        { label: 'Tournament', href: '/tournament' },
      ],
    },
    { label: 'profile', href: '/profile' },
    { label: 'settings', href: '/settings' },
    { label: 'chat', href: '/chat' },
    { label: 'leaderboard', href: '/leaderboard' },
    { label: 'logout', href: '/logout' },
  ];

  constructor(
    router: Router,
    private skipThis?: string,
  ) {
    this.router = router;
    this.menuBarItems = MenuBar.defaultMenuBarItems.slice();
  }

  render(): HTMLElement {
    const ul = document.createElement('ul');
    ul.setAttribute('role', 'menu-bar');

    this.menuBarItems.forEach((menu: MenuBarItem) => {
      if (this.skipThis && menu.label == this.skipThis) return;
      const li = document.createElement('li');
      li.setAttribute('role', 'menu-item');
      li.setAttribute('tabindex', '0');

      // Single item (no dropdown)
      if (!menu.items || menu.items.length === 0) {
        li.setAttribute('aria-haspopup', 'false');
        if (menu.href) {
          const a = document.createElement('a');
          a.textContent = menu.label;
          a.href = menu.href;
          if (menu.style) a.className = menu.style;
          li.appendChild(a);
        } else {
          li.textContent = menu.label;
          if (menu.style) li.className = menu.style;
        }
        ul.appendChild(li);
        return;
      }

      // Dropdown menu
      li.setAttribute('aria-haspopup', 'true');
      li.textContent = menu.label;
      if (menu.style) li.className = menu.style;

      const subUl = document.createElement('ul');
      subUl.setAttribute('role', 'menu');

      menu.items.forEach((item) => {
        const subLi = document.createElement('li');
        subLi.setAttribute('role', 'menu-item');
        if (item.divider) subLi.classList.add('divider');
        if (item.style) subLi.className = item.style;
        const a = document.createElement('a');
        a.textContent = item.label;
        if (item.href) {
          a.href = item.href;
        } else {
          a.href = '#menu';
        }
        subLi.appendChild(a);
        subUl.appendChild(subLi);
      });

      li.appendChild(subUl);
      ul.appendChild(li);
    });

    return ul;
  }
}
