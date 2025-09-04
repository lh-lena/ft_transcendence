import { ServiceContainer, Router, Backend } from "../../services";
import { Window } from "../../components/window";
import { CANVAS_DEFAULTS } from "../../types";
import { MenuBar } from "../../components/menuBar";
import { ProfileAvatar } from "../../components/profileAvatar";
import { sampleChatHistory, userStore } from "../../constants/backend";
import { InformationIcon } from "../../components/informationIcon";
import { ProfilePopUp } from "../../components/profilePopUp";

// new backend types
import { User } from "../../types";

// pretend backend -> change
import { sampleFriends } from "../../constants/backend";
import { FriendsIcon } from "../../components/profileIcon";

export class ChatPage {
  private serviceContainer: ServiceContainer;
  private router: Router;
  private container;
  private clickedContact!: HTMLDivElement;
  private bottomBar: HTMLDivElement;
  private inputBox: HTMLDivElement;
  private actionButton: HTMLElement;
  private inputMessage: HTMLInputElement;
  private sendButton: HTMLElement;
  private sendInvite!: HTMLDivElement;
  private chatPanel: HTMLDivElement;
  private addFriendsPanel: HTMLDivElement;
  private chatRow: HTMLDivElement;
  private profilePopUp: ProfilePopUp;
  private backend: Backend;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");

    // grab user data from backend

    this.container = document.createElement("div");
    this.container.className =
      "w-full min-h-screen flex flex-col items-center justify-center bg-brandBlue";

    // menu bar
    const menuBar = new MenuBar(this.router, "friends").render();

    // main chat row
    this.chatRow = document.createElement("div");
    this.chatRow.className = "flex flex-row w-full gap-3";

    // contacts panel
    const contactsPanel = document.createElement("div");
    contactsPanel.className = "flex-shrink-0 w-1/5 h-96 flex flex-col";
    const contacts = document.createElement("div");
    contacts.className =
      "flex flex-col gap-2 w-full overflow-y-auto flex-1 pr-2";
    contactsPanel.appendChild(contacts);

    // YOU BUTTON
    const clickableYoubutton = document.createElement("a");
    const addYouButton = document.createElement("div");
    clickableYoubutton.style.cursor = "pointer";
    clickableYoubutton.className = "w-full";
    addYouButton.className =
      "standard-dialog flex flex-row w-full gap-3 mb-2 justify-center items-center";
    const youButtonAvatar = new ProfileAvatar(
      userStore.color,
      userStore.colorMap,
      30,
      30,
      2,
    );
    addYouButton.appendChild(youButtonAvatar.getElement());
    const addYouButtonText = document.createElement("h1");
    addYouButtonText.textContent = userStore.username;
    addYouButton.appendChild(addYouButtonText);
    clickableYoubutton.appendChild(addYouButton);
    clickableYoubutton.onclick = () => this.toggleProfilePopUp();
    contacts.appendChild(clickableYoubutton);

    // LEADERBOARD BUTTON
    const clickableLeaderboardbutton = document.createElement("a");
    const addLeaderboardButton = document.createElement("div");
    clickableLeaderboardbutton.style.cursor = "pointer";
    clickableLeaderboardbutton.className = "w-full";
    addLeaderboardButton.className =
      "standard-dialog w-full text-center items-center mb-2";
    const addLeaderboardButtonText = document.createElement("h1");
    addLeaderboardButtonText.textContent = "leaderboard";
    addLeaderboardButton.appendChild(addLeaderboardButtonText);
    clickableLeaderboardbutton.appendChild(addLeaderboardButton);
    clickableLeaderboardbutton.onclick = () =>
      this.toggleAddFriend(addLeaderboardButton);
    contacts.appendChild(clickableLeaderboardbutton);

    const friendsHeaderRow = document.createElement("div");
    friendsHeaderRow.className =
      "flex flex-row gap-2 mb-2 justify-center items-center";
    const friendsIcon = new FriendsIcon();
    friendsHeaderRow.appendChild(friendsIcon.getNode());
    const friendsHeader = document.createElement("h1");
    friendsHeader.textContent = "friends";
    friendsHeaderRow.appendChild(friendsHeader);
    contacts.appendChild(friendsHeaderRow);

    // adding add friends button in contacts panel to style it the same
    const clickableAddFriendButton = document.createElement("a");
    const addFriendButton = document.createElement("div");
    clickableAddFriendButton.style.cursor = "pointer";
    clickableAddFriendButton.className = "w-full";
    addFriendButton.className =
      "standard-dialog w-full text-center items-center";
    const addFriendButtonText = document.createElement("h1");
    addFriendButtonText.textContent = "add friend +";
    addFriendButton.appendChild(addFriendButtonText);
    clickableAddFriendButton.appendChild(addFriendButton);
    clickableAddFriendButton.onclick = () =>
      this.toggleAddFriend(addFriendButton);
    contacts.appendChild(clickableAddFriendButton);

    const onlineHeader = document.createElement("h1");
    onlineHeader.textContent = "online:";
    onlineHeader.className = "text-center text-emerald-800";
    const offlineHeader = document.createElement("h1");
    offlineHeader.textContent = "offline:";
    offlineHeader.className = "text-center text-red-800";
    contacts.appendChild(onlineHeader);
    contacts.appendChild(offlineHeader);

    // contacts on left
    sampleFriends.forEach((friend) => {
      const contact = document.createElement("div");
      contact.className =
        "flex flex-row gap-2 box standard-dialog w-full items-center";
      const clickableContact = document.createElement("a");
      clickableContact.onclick = () => this.clickChatContact(contact);
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
      // insert logic for online offline
      if (friend.status == "online") {
        contacts.insertBefore(clickableContact, offlineHeader);
      } else {
        contacts.appendChild(clickableContact);
      }
    });

    // chat panel
    this.chatPanel = document.createElement("div");
    this.chatPanel.className =
      "flex-1 w-4/5 h-96 standard-dialog flex flex-col";
    // information bar "chat with" information button
    const informationBar = document.createElement("div");
    informationBar.className = "flex flex-row pb-2";
    const informationText = document.createElement("h1");
    informationText.textContent = "Chat with XXX";
    informationBar.appendChild(informationText);
    const informationIcon = new InformationIcon(() =>
      this.toggleProfilePopUp(),
    );
    informationIcon.mount(informationBar);
    informationIcon.className("ml-auto");
    this.chatPanel.appendChild(informationBar);
    const messages = document.createElement("div");
    messages.className = "flex flex-col flex-1 overflow-y-auto p-2 gap-2";
    this.chatPanel.appendChild(messages);
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

    this.chatRow.appendChild(contactsPanel);
    this.chatRow.appendChild(this.chatPanel);

    // add friends panel (toggles on add friend)
    this.addFriendsPanel = document.createElement("div");
    this.addFriendsPanel.className =
      "flex-1 w-4/5 h-96 standard-dialog flex flex-col";
    // search function for friends
    const friendsInputBox = document.createElement("div");
    friendsInputBox.className =
      "flex flex-row gap-2 w-full pt-2 items-center px-2";
    this.addFriendsPanel.appendChild(friendsInputBox);
    const friendsInputBoxSearch = document.createElement("input");
    friendsInputBoxSearch.className = "w-4/5 rounded h-10";
    friendsInputBoxSearch.type = "text";
    friendsInputBoxSearch.style.paddingLeft = "0.5em";
    friendsInputBoxSearch.placeholder = "search";
    friendsInputBox.appendChild(friendsInputBoxSearch);
    const searchButton = document.createElement("button");
    searchButton.textContent = "search";
    searchButton.className =
      "btn flex items-center justify-center text-center h-10 w-1/5";
    searchButton.onclick = () => this.sendButtonHook();
    friendsInputBox.appendChild(searchButton);

    // search results add friends
    const searchResults = document.createElement("div");
    searchResults.className =
      "grid grid-cols-3 gap-2 p-2 w-full my-3 overflow-y-auto";
    this.addFriendsPanel.appendChild(searchResults);
    sampleFriends.forEach((friend) => {
      const contact = document.createElement("div");
      contact.className =
        "flex flex-row gap-2 box standard-dialog w-full items-center";
      const clickableContact = document.createElement("a");
      clickableContact.onclick = () => this.toggleProfilePopUp();
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
      searchResults.appendChild(clickableContact);
    });

    // input at bottom
    this.inputBox = document.createElement("div");
    this.inputBox.className =
      "flex flex-row gap-2 w-full mt-auto pt-2 items-center";
    this.actionButton = document.createElement("button");
    this.actionButton.className = "btn items-center justify-center h-10 w-1/10";
    this.actionButton.innerText = "+";
    this.actionButton.onclick = () => this.toggleInvitePrompt();
    this.inputBox.appendChild(this.actionButton);
    this.inputMessage = document.createElement("input");
    this.inputMessage.className = "w-4/5 rounded h-10";
    this.inputMessage.type = "text";
    this.inputMessage.style.paddingLeft = "0.5em";
    this.inputMessage.placeholder = "message";
    this.sendButton = document.createElement("button");
    this.sendButton.textContent = "send";
    this.sendButton.className = "btn items-center justify-center h-10 w-1/5";
    this.sendButton.onclick = () => this.sendButtonHook();

    this.inputBox.appendChild(this.inputMessage);
    this.inputBox.appendChild(this.sendButton);
    this.bottomBar = this.inputBox;
    this.chatPanel.appendChild(this.bottomBar);
    // set input box as initial buttom bar

    this.profilePopUp = new ProfilePopUp(() => this.toggleProfilePopUp());

    // window
    const windowComponent = new Window({
      title: "Chat",
      width: CANVAS_DEFAULTS.width,
      height: CANVAS_DEFAULTS.height,
      className: "",
      children: [menuBar, this.chatRow],
    });
    this.container.appendChild(windowComponent.getElement());
  }

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  private toggleInvitePrompt(): void {
    // toggle back to normal state (invite has been sent)
    if (this.inputBox.contains(this.sendInvite)) {
      this.actionButton.textContent = "+";
      this.inputBox.removeChild(this.sendInvite);
      this.inputBox.insertBefore(this.actionButton, this.sendButton);
      this.inputBox.insertBefore(this.inputMessage, this.sendButton);
      return;
    }
    // get rid of these two
    this.actionButton.textContent = "x";
    this.inputBox.removeChild(this.inputMessage);
    this.sendInvite = document.createElement("div");
    this.sendInvite.className =
      "standard-dialog rounded flex items-center w-4/5 h-10";
    const sendInviteText = document.createElement("h1");
    sendInviteText.textContent = "send game invite to user XXX?";
    sendInviteText.className = "text-center w-full";
    this.sendInvite.appendChild(sendInviteText);
    this.inputBox.insertBefore(this.sendInvite, this.sendButton);
  }

  private clickChatContact(contact: HTMLDivElement): void {
    // check if we need to toggle off add friends panel
    if (this.chatRow.contains(this.addFriendsPanel)) {
      this.chatRow.removeChild(this.addFriendsPanel);
      if (this.chatRow.contains(this.profilePopUp.getNode()))
        this.chatRow.insertBefore(this.chatPanel, this.profilePopUp.getNode());
      else this.chatRow.appendChild(this.chatPanel);
    }
    // remove styling from old contact selected
    if (this.clickedContact) {
      this.clickedContact.classList.remove("bg-black");
      this.clickedContact.classList.remove("text-white");
    }
    contact.classList.add("text-black");
    // select new contact
    contact.classList.add("bg-black");
    contact.classList.add("text-white");
    this.clickedContact = contact;
  }

  private sendButtonHook(): void {
    // release toggle
    if (this.inputBox.contains(this.sendInvite)) this.toggleInvitePrompt();
  }

  private toggleAddFriend(contact: HTMLDivElement): void {
    this.clickChatContact(contact);
    this.chatRow.removeChild(this.chatPanel);
    if (this.chatRow.contains(this.profilePopUp.getNode())) {
      // insert before profile pop
      this.chatRow.insertBefore(
        this.addFriendsPanel,
        this.profilePopUp.getNode(),
      );
    } else this.chatRow.appendChild(this.addFriendsPanel);
  }

  private toggleProfilePopUp(): void {
    if (this.chatRow.contains(this.profilePopUp.getNode())) {
      this.chatRow.removeChild(this.profilePopUp.getNode());
    } else this.chatRow.appendChild(this.profilePopUp.getNode());
  }

  public unmount(): void {
    this.container.remove();
  }
}
