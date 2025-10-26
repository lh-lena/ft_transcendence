import { generateProfilePrint } from "../../utils/profilePrintFunctions";
import { ProfileAvatar } from "../profileAvatar";

// DEPRECRATED -> decided not to use

export class SpectatorBar {
  private element: HTMLElement;
  private spectatorBoxes: HTMLElement[] = [];

  constructor() {
    this.element = document.createElement("div");
    this.element.className =
      "flex flex-row justify-center gap-8 w-[880px] max-w-[880px]";

    // Create 8 spectator boxes
    for (let i = 0; i < 8; i++) {
      const { color, colorMap } = generateProfilePrint();
      const profileAvatar = new ProfileAvatar(
        color,
        colorMap /*TODO the avatars of the spectators??*/,
      ); // You can set width/height/gridSize as needed
      profileAvatar.mount(this.element); // Mounts the avatar to the SpectatorBar
      this.spectatorBoxes.push(profileAvatar.getElement());
    }
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.element.remove();
  }
}
