import { Router } from "../../router";
import { Window } from "../../components/window";
import { CANVAS_DEFAULTS } from "../../types";
import { MenuBar } from "../../components/menuBar";
import { sampleFriends } from "../../constants/backend";
import { ProfileAvatar } from "../../components/profileAvatar";
import { sampleChatHistory } from "../../constants/backend";

export class ChatPage {
  private container;
  private clickedContact!: HTMLDivElement;
  private bottomBar: HTMLDivElement;

  constructor(private router: Router) {
    this.container = document.createElement("div");
    this.container.className =
      "w-full min-h-screen flex items-center justify-center bg-brandBlue";

    // menu bar
    const menuBar = new MenuBar(router, "chat").render();

    // main chat row
    const chatRow = document.createElement("div");
    chatRow.className = "flex flex-row w-full gap-3";

    // contacts panel
    const contactsPanel = document.createElement("div");
    contactsPanel.className = "flex-shrink-0 w-1/5 h-96 flex flex-col";
    const contacts = document.createElement("div");
    contacts.className =
      "flex flex-col gap-2 w-full overflow-y-auto flex-1 pr-2";
    contactsPanel.appendChild(contacts);

    sampleFriends.forEach((friend) => {
      const contact = document.createElement("div");
      contact.className =
        "flex flex-row gap-2 box standard-dialog w-full items-center";
      const clickableContact = document.createElement("a");
      clickableContact.onclick = () => this.onClickTest(contact);
      clickableContact.style.cursor = "pointer";
      const contactName = document.createElement("h1");
      contactName.textContent = friend.username;
      const contactAvatar = new ProfileAvatar(
        friend.color,
        friend.colorMap,
        30,
        30,
        2,
      ).getElement();
      clickableContact.appendChild(contact);
      contact.appendChild(contactAvatar);
      contact.appendChild(contactName);
      contacts.appendChild(clickableContact);
    });

    // chat panel
    const chatPanel = document.createElement("div");
    chatPanel.className = "flex-1 w-4/5 h-96 standard-dialog flex flex-col";
    const messages = document.createElement("div");
    messages.className = "flex flex-col flex-1 overflow-y-auto p-2 gap-2";
    chatPanel.appendChild(messages);
    sampleChatHistory.forEach((message) => {
      const messageBox = document.createElement("div");
      messageBox.className = "standard-dialog flex items-center self-start";
      const messageText = document.createElement("h1");
      messageText.textContent = message.message;
      if (message.sender != "me") {
        messageBox.classList.add("!self-end");
        messageBox.classList.add("bg-black");
        messageBox.classList.add("text-white");
      }
      messageBox.appendChild(messageText);
      messages.appendChild(messageBox);
    });

    chatRow.appendChild(contactsPanel);
    chatRow.appendChild(chatPanel);

    // input at bottom
    const inputBox = document.createElement("div");
    inputBox.className = "flex flex-row gap-2 w-full mt-auto pt-2";
    const actionButton = document.createElement("button");
    actionButton.className = "btn items-center justify-center w-1/10";
    actionButton.innerText = "+";
    inputBox.appendChild(actionButton);
    const inputMessage = document.createElement("input");
    inputMessage.className = "w-4/5 rounded";
    inputMessage.type = "text";
    inputMessage.style.paddingLeft = "0.5em";
    inputMessage.placeholder = "message";
    const sendButton = document.createElement("button");
    sendButton.textContent = "send";
    sendButton.className = "btn items-center justify-center w-1/5";

    inputBox.appendChild(inputMessage);
    inputBox.appendChild(sendButton);
    this.bottomBar = inputBox;
    chatPanel.appendChild(this.bottomBar);
    // set input box as initial buttom bar

    // window
    const windowComponent = new Window({
      title: "Chat",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBar, chatRow],
    });
    this.container.appendChild(windowComponent.getElement());
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  private toggleInvitePrompt(): void {}

  private onClickTest(contact: HTMLDivElement): void {
    // remove styling from old contact selected
    if (this.clickedContact) {
      this.clickedContact.classList.remove("bg-black");
      this.clickedContact.classList.remove("text-white");
    }
    // select new contact
    contact.classList.add("bg-black");
    contact.classList.add("text-white");
    this.clickedContact = contact;
  }

  public unmount(): void {
    this.container.remove();
  }
}
