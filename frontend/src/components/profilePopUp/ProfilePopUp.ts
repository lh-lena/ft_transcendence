import { CloseIcon } from "../closeIcon/CloseIcon";
import { ProfileAvatar } from "../profileAvatar";
import { User } from "../../types";

export class ProfilePopUp {
  private main: HTMLElement;

  constructor(
    closeCallBack: () => void,
    user: User,
    style?: string,
    addFriendCallback?: () => void,
    blockFriendCallback?: () => void,
    isFriend?: boolean,
    removeFriendCallback?: () => void,
    isBlocked?: boolean,
    unBlockFriendCallback?: () => void,
  ) {
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
    const userPic = new ProfileAvatar(user.color, user.colormap).getElement();
    userPic.className = "mx-auto animate-bounce-slow";
    userDiv.appendChild(userPic);

    const username = document.createElement("h1");
    username.innerText = user.username;
    userDiv.appendChild(username);

    if (style == "friend") {
      const addFriendButton = document.createElement("button");
      if (!isFriend) addFriendButton.innerText = "add";
      else addFriendButton.innerText = "remove";
      if (addFriendCallback)
        addFriendButton.onclick = () => addFriendCallback();
      if (removeFriendCallback && isFriend)
        addFriendButton.onclick = () => removeFriendCallback();
      addFriendButton.className = "btn mt-auto";
      const blockFriendButton = document.createElement("button");
      if (!isBlocked) blockFriendButton.innerText = "block";
      else blockFriendButton.innerText = "unblock";
      blockFriendButton.className = "btn";
      if (blockFriendCallback)
        blockFriendButton.onclick = () => blockFriendCallback();
      if (unBlockFriendCallback && isBlocked)
        blockFriendButton.onclick = () => unBlockFriendCallback();
      this.main.appendChild(addFriendButton);
      this.main.appendChild(blockFriendButton);
    }
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
