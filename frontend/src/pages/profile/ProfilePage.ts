import { ServiceContainer, Router, Websocket } from "../../services";
import { ProfileAvatar } from "../../components/profileAvatar";
import { MenuBar } from "../../components/menuBar";
import { CANVAS_DEFAULTS } from "../../types";
import { Window } from "../../components/window";
import { ScoreBox } from "../../components/scoreBoxes";

// deprecrated

import { userStore } from "../../constants/backend";
import { sampleScores } from "../../constants/backend";

export class ProfilePage {
  private container: HTMLElement;
  private serviceContainer: ServiceContainer;
  private router: Router;
  private menuBar: MenuBar;
  private ws: Websocket;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.ws = this.serviceContainer.get<Websocket>("websocket");

    // Full page background
    this.container = document.createElement("div");
    this.container.className =
      "w-full min-h-screen flex items-center justify-center bg-brandBlue";

    // Window content

    // skips profile menuBar
    this.menuBar = new MenuBar(serviceContainer, "profile");
    const menuBarElement = this.menuBar.render();

    const profilePic = new ProfileAvatar(
      userStore.color,
      userStore.colorMap,
      40,
      40,
      2,
      //TODO need these in userStore
      //userStore.avatar ? "image" : undefined,
      //user.userId,
    ).getElement();
    profilePic.className = "animate-bounce-slow";

    const header = document.createElement("h1");
    header.textContent = `hi ${userStore.username}`;
    header.className = "text-black title text-2xl";

    const profileCard = document.createElement("div");
    profileCard.className = "flex flex-col items-center";
    profileCard.appendChild(profilePic);
    profileCard.appendChild(header);

    const scoreBoxes = document.createElement("div");
    scoreBoxes.className = "flex flex-col gap-5";
    sampleScores.forEach((scoreObj) => {
      let box = new ScoreBox(scoreObj.playerName, scoreObj.score.toString());
      scoreBoxes.appendChild(box.getElement());
      if (sampleScores.indexOf(scoreObj) == 0) {
        box = new ScoreBox("mo", "20");
        box.getElement().classList.add("mb-4");
        const leaderboardText = document.createElement("h1");
        leaderboardText.textContent = "leaderboard:";
        leaderboardText.className = "text-center";
        scoreBoxes.appendChild(leaderboardText);
      }
    });

    // use Window component
    const windowComponent = new Window({
      title: "Profile",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBarElement, profileCard, scoreBoxes],
    });
    this.container.appendChild(windowComponent.getElement());

    // init web socket on profile (logged in - online)
    this.ws.initializeWebSocket();
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.container.remove();
  }
}
