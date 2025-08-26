import { CloseIcon } from "../../components/closeIcon/CloseIcon";
import { userStore2 } from "../../constants/backend";
import { ProfileAvatar } from "../profileAvatar";

export class ProfilePopUp {
  private main: HTMLElement;

  constructor(closeCallBack: () => void) {
    this.main = document.createElement("div");
    this.main.className =
      "standard-dialog w-48 flex justify-center flex-col gap-5 pb-4";

    const titleBar = document.createElement("div");
    titleBar.className = "flex flex-row";
    this.main.appendChild(titleBar);
    const closeIcon = new CloseIcon(closeCallBack);
    closeIcon.className("ml-auto");
    closeIcon.mount(titleBar);

    const userDiv = document.createElement("div");
    userDiv.className = "mx-auto flex flex-col gap-8 my-auto";
    this.main.appendChild(userDiv);
    const userPic = new ProfileAvatar(
      userStore2.color,
      userStore2.colorMap,
    ).getElement();
    userPic.className = "mx-auto animate-bounce-slow";
    userDiv.appendChild(userPic);

    const username = document.createElement("h1");
    username.innerText = userStore2.username;
    userDiv.appendChild(username);

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
    this.main.remove();
  }
}
