import { CloseIcon } from "../closeIcon/CloseIcon";
import { ProfileAvatar } from "../profileAvatar";
import { User } from "../../types";
import { userWinsLosses } from "../../types/backend";

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
    winsAndLosses?: userWinsLosses,
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
    const userPic = new ProfileAvatar(
      user.color,
      user.colormap,
      undefined,
      undefined,
      undefined,
      user.avatar ? "image" : undefined,
      user.userId,
    ).getElement();
    userPic.className = "mx-auto animate-bounce-slow";
    userDiv.appendChild(userPic);

    const username = document.createElement("h1");
    username.innerText = user.username;
    username.className = "text-center";
    userDiv.appendChild(username);

    if (winsAndLosses) {
      const winLossRow = document.createElement("div");
      winLossRow.className = "flex flex-row gap-3";
      const wins = document.createElement("h1");
      wins.textContent = `${winsAndLosses.wins} wins`;
      wins.className = "text-xs text-emerald-800";
      winLossRow.appendChild(wins);
      const seperator = document.createElement("h1");
      seperator.textContent = "|";
      seperator.className = "text-xs";
      winLossRow.appendChild(seperator);
      const losses = document.createElement("h1");
      losses.textContent = `${winsAndLosses.loses} losses`;
      losses.className = "text-xs text-red-700";
      winLossRow.appendChild(losses);
      userDiv.appendChild(winLossRow);
    }

    if (style == "friend") {
      const addFriendButton = document.createElement("button");
      if (!isFriend) addFriendButton.innerText = "add";
      else addFriendButton.innerText = "remove";
      if (addFriendCallback)
        addFriendButton.onclick = () => addFriendCallback();
      if (removeFriendCallback && isFriend)
        addFriendButton.onclick = () => removeFriendCallback();
      addFriendButton.className = "btn mt-auto";
      this.main.appendChild(addFriendButton);
      if (isFriend) {
        const blockFriendButton = document.createElement("button");
        if (!isBlocked) blockFriendButton.innerText = "block";
        else blockFriendButton.innerText = "unblock";
        blockFriendButton.className = "btn";
        if (blockFriendCallback)
          blockFriendButton.onclick = () => blockFriendCallback();
        if (unBlockFriendCallback && isBlocked)
          blockFriendButton.onclick = () => unBlockFriendCallback();
        this.main.appendChild(blockFriendButton);
      }
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
