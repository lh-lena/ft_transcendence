import { Router } from "../../router";
import { ProfileAvatar } from "../../components/profileAvatar";
import { Loading } from "../../components/loading";
import { MenuBar } from "../../components/menuBar";
import { CANVAS_DEFAULTS } from "../../types";
import { Window } from "../../components/window";
import { ScoreBox } from "../../components/scoreBoxes";

// TODO-BACKEND
import {
  userStore,
  sampleFriends,
  sampleScoreHistory,
} from "../../constants/backend";

export class ProfilePage {
  private container: HTMLElement;
  private loadingScreen: Loading;
  private menuBar: MenuBar;

  constructor(private router: Router) {
    // Full page background
    this.container = document.createElement("div");
    this.container.className =
      "w-full min-h-screen flex items-center justify-center bg-brandBlue";

    // Window content

    // skips profile menuBar
    this.menuBar = new MenuBar(router, "profile");
    const menuBarElement = this.menuBar.render();

    const profilePic = new ProfileAvatar(
      userStore.color,
      userStore.colorMap,
      40,
      40,
      2,
    ).getElement();
    profilePic.className = "animate-bounce-slow";

    const header = document.createElement("h1");
    header.textContent = `hi ${userStore.username}`;
    header.className = "text-black title text-2xl";

    const profileCard = document.createElement("div");
    profileCard.className = "flex flex-col items-center";
    profileCard.appendChild(profilePic);
    profileCard.appendChild(header);

    const profileBottomRow = document.createElement("div");
    profileBottomRow.className = `flex flex-row gap-10 w-full`;

    // match history collumn
    const matchHistoryCollumn = document.createElement("div");
    matchHistoryCollumn.className =
      "flex flex-col gap-5 items-center text-center w-1/2";
    const scoreBoxTitle = document.createElement("h1");
    scoreBoxTitle.textContent = "match history:";
    const scoreBoxes = document.createElement("div");
    scoreBoxes.className = "flex flex-col gap-2";
    sampleScoreHistory.forEach((scoreObj) => {
      const box = new ScoreBox(scoreObj.playerName, scoreObj.result);
      scoreBoxes.appendChild(box.getElement());
    });

    matchHistoryCollumn.appendChild(scoreBoxTitle);
    matchHistoryCollumn.appendChild(scoreBoxes);

    // friends collummn
    const friendsCollumn = document.createElement("div");
    friendsCollumn.className =
      "flex flex-col gap-5 items-center text-center w-1/2";
    const friendsTitle = document.createElement("h1");
    friendsTitle.textContent = "friends:";
    const friends = document.createElement("div");
    friends.className =
      "flex flex-col gap-2 gap-10 justify-items-center w-[300px]";

    // Add friend avatars (limit to 9 friends)
    sampleFriends.slice(0, 9).forEach((friend) => {
      const box = document.createElement("div");
      box.className =
        "flex flex-row justify-start standard-dialog w-[300px] gap-5 h-20 items-center p-4";
      const friendAvatar = new ProfileAvatar(
        friend.color,
        friend.colorMap,
        30,
        30,
        2,
      ).getElement();
      friendAvatar.title = friend.username;
      const friendName = document.createElement("h1");
      friendName.textContent = friend.username;
      const chatButton = document.createElement("button");
      chatButton.className = "btn ml-auto";
      chatButton.innerText = "chat";
      box.appendChild(friendAvatar);
      box.appendChild(friendName);
      box.appendChild(chatButton);
      friends.appendChild(box);
    });

    friendsCollumn.appendChild(friendsTitle);
    friendsCollumn.appendChild(friends);

    // put both rows into the bottom collumn
    profileBottomRow.appendChild(matchHistoryCollumn);
    profileBottomRow.appendChild(friendsCollumn);

    // use Window component
    const windowComponent = new Window({
      title: "Profile",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBarElement, profileCard, profileBottomRow],
    });
    this.container.appendChild(windowComponent.getElement());

    // waiting for opponent loading screen
    this.loadingScreen = new Loading(
      "waiting for opponent",
      "button",
      this.cancelWaitForOpponent.bind(this),
    );
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.container.remove();
  }

  private waitForOpponent(): void {
    this.loadingScreen.mount(document.body);
  }

  private cancelWaitForOpponent(): void {
    this.loadingScreen.hide();
  }
}
