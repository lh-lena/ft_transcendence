import { userStore2 } from "../../constants/backend";
import { ProfileAvatar } from "../profileAvatar";

export class ProfilePopUp {
  private main: HTMLElement;

  constructor() {
    this.main = document.createElement("div");
    this.main.className = "standard-dialog w-48 flex flex-col gap-4 p-8";

    const userPic = new ProfileAvatar(
      userStore2.color,
      userStore2.colorMap,
    ).getElement();
    userPic.className = "mx-auto animate-bounce-slow";

    this.main.appendChild(userPic);

    const username = document.createElement("h1");
    username.innerText = userStore2.username;
    this.main.appendChild(username);
    username.className = "mx-auto";

    const addFriendButton = document.createElement("button");
    addFriendButton.innerText = "add";
    addFriendButton.className = "btn mt-auto";
    const blockFriendButton = document.createElement("button");
    blockFriendButton.innerText = "block";
    blockFriendButton.className = "btn";
    this.main.appendChild(addFriendButton);
    this.main.appendChild(blockFriendButton);
  }

  public getNode(): HTMLElement {
    return this.main;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.main);
  }

  unmount(): void {
    this.main.remove;
  }
}
