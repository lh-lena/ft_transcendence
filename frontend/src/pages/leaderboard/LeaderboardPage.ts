import { ServiceContainer, Router } from "../../services";
import { CANVAS_DEFAULTS } from "../../types";
import { Window } from "../../components/window";
import { MenuBar } from "../../components/menuBar";

import { ScoreBox } from "../../components/scoreBoxes";

// TODO-BACKEND
import { sampleScores } from "../../constants/backend";

export class LeaderboardPage {
  private container: HTMLElement;
  private serviceContainer: ServiceContainer;
  private router: Router;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");

    // Full page background
    this.container = document.createElement("div");
    this.container.className =
      "w-full min-h-screen flex items-center justify-center bg-brandBlue";

    // Window content
    const menuBar = new MenuBar(serviceContainer, "leaderboard");

    const mainCollumn = document.createElement("div");
    mainCollumn.className = "flex flex-col gap-3";

    const buttonRow = document.createElement("div");
    buttonRow.className = "flex flex-row gap-5";
    mainCollumn.appendChild(buttonRow);

    const buttonOne = document.createElement("button");
    buttonOne.className = "btn btn-default flex items-center justify-center";
    buttonOne.textContent = "this";
    buttonRow.appendChild(buttonOne);

    const buttonTwo = document.createElement("button");
    buttonTwo.className = "btn flex items-center justify-center";
    buttonTwo.textContent = "that";
    buttonRow.appendChild(buttonTwo);

    const scoreBoxes = document.createElement("div");
    scoreBoxes.className = "flex flex-col gap-5";
    sampleScores.forEach((scoreObj) => {
      const box = new ScoreBox(scoreObj.playerName, scoreObj.score.toString());
      scoreBoxes.appendChild(box.getElement());
    });

    const windowComponent = new Window({
      title: "Leaderboard",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBar.render(), mainCollumn, scoreBoxes],
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
