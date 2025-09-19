import { ServiceContainer, Router, Backend } from "../../services";
import { Window } from "../../components/window";
import { CANVAS_DEFAULTS, FriendsList, UsersAll } from "../../types";
import { MenuBar } from "../../components/menuBar";
import { ProfileAvatar } from "../../components/profileAvatar";
import { sampleChatHistory } from "../../constants/backend";
import { InformationIcon } from "../../components/informationIcon";
import { ProfilePopUp } from "../../components/profilePopUp";

// pretend backend -> change
import { sampleFriends } from "../../constants/backend";
import { FriendsIcon } from "../../components/friendsIcon";
import { Leaderboard } from "../../types/leaderboard";
import { profilePrintToArray } from "../../utils/profilePrintFunctions";

import { User } from "../../types";

export class ChatPage {
  private serviceContainer: ServiceContainer;
  private router: Router;
  private container!: HTMLDivElement;
  private clickedContact!: HTMLDivElement;
  private bottomBar!: HTMLDivElement;
  private inputBox!: HTMLDivElement;
  private actionButton!: HTMLElement;
  private inputMessage!: HTMLInputElement;
  private sendButton!: HTMLElement;
  private sendInvite!: HTMLDivElement;
  private chatPanel!: HTMLDivElement;
  private addFriendsPanel!: HTMLDivElement;
  private chatRow!: HTMLDivElement;
  private leaderboardPanel!: HTMLDivElement;
  private profilePopUp!: HTMLElement;
  private backend: Backend;
  // keeps track of what panel is on left
  private leftPanel!: HTMLDivElement;
  // keeps track of what panel is on right
  private rightPanel!: HTMLElement;
  private leaderboardData!: Leaderboard;
  private allUserData!: UsersAll;
  private searchInput!: HTMLInputElement;
  private friendsList!: FriendsList;
  private searchResults!: HTMLDivElement;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.router = this.serviceContainer.get<Router>("router");
    this.backend = this.serviceContainer.get<Backend>("backend");
  }

  public static async create(
    serviceContainer: ServiceContainer,
  ): Promise<ChatPage> {
    const instance = new ChatPage(serviceContainer);

    // handle async operations

    // all users fetch
    instance.allUserData = (await instance.backend.fetchAllUsers()).data;
    for (const element of instance.allUserData) {
      element.colormap =
        typeof element.colormap === "string"
          ? profilePrintToArray(element.colormap)
          : element.colormap;
    }
    // leaderboard fetch
    const initLeaderboardData: Leaderboard =
      await instance.backend.getLeaderboard();
    for (const element of initLeaderboardData) {
      const userResponse = await instance.backend.fetchUserById(element.userId);
      element.username = userResponse.data.username;
      element.colormap = profilePrintToArray(userResponse.data.colormap);
      element.color = userResponse.data.color;
      element.avatar = userResponse.data.avatar;
    }
    instance.leaderboardData = initLeaderboardData;
    // instance.friendsList = await instance.backend.fetchFriendsById(
    //   instance.backend.getUser().userId,
    // );

    // Complete the UI setup
    instance.setupUI();

    return instance;
  }

  private setupUI() {
    const user: User = this.backend.getUser();

    // main container
    this.container = document.createElement("div");
    this.container.className =
      "w-full min-h-screen flex flex-col items-center justify-center bg-brandBlue";

    // MENU BAR TOP
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
    this.chatRow.appendChild(contactsPanel);

    // YOU BUTTON
    const clickableYoubutton = document.createElement("a");
    const addYouButton = document.createElement("div");
    clickableYoubutton.style.cursor = "pointer";
    clickableYoubutton.className = "w-full";
    addYouButton.className =
      "standard-dialog flex flex-row w-full gap-3 mb-2 justify-center items-center";
    const youButtonAvatar = new ProfileAvatar(
      user.color,
      user.colormap,
      30,
      30,
      2,
    ).getElement();
    addYouButton.appendChild(youButtonAvatar);
    const addYouButtonText = document.createElement("h1");
    addYouButtonText.textContent = user.username;
    addYouButton.appendChild(addYouButtonText);
    clickableYoubutton.appendChild(addYouButton);
    clickableYoubutton.onclick = () => this.toggleProfilePopUp(user);
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
    clickableLeaderboardbutton.onclick = () => this.toggleLeaderboardPanel();
    contacts.appendChild(clickableLeaderboardbutton);

    // FRIENDS ICON: adds seperation to collumn
    const friendsHeaderRow = document.createElement("div");
    friendsHeaderRow.className =
      "flex flex-row gap-2 mb-2 justify-center items-center";
    const friendsIcon = new FriendsIcon();
    friendsHeaderRow.appendChild(friendsIcon.getNode());
    const friendsHeader = document.createElement("h1");
    friendsHeader.textContent = "friends";
    friendsHeaderRow.appendChild(friendsHeader);
    contacts.appendChild(friendsHeaderRow);

    // ADD FRIENDS ICON
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
    clickableAddFriendButton.onclick = () => this.toggleAddFriendPanel();
    contacts.appendChild(clickableAddFriendButton);

    const onlineHeader = document.createElement("h1");
    onlineHeader.textContent = "online:";
    onlineHeader.className = "text-center text-emerald-800";
    const offlineHeader = document.createElement("h1");
    offlineHeader.textContent = "offline:";
    offlineHeader.className = "text-center text-red-800";
    contacts.appendChild(onlineHeader);
    contacts.appendChild(offlineHeader);

    // CONTACTS
    sampleFriends.forEach((friend) => {
      const contact = document.createElement("div");
      contact.className =
        "flex flex-row gap-2 box standard-dialog w-full items-center";
      const clickableContact = document.createElement("a");
      clickableContact.onclick = () => this.toggleChatPanel(contact);
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

    // LEADERBOARDPANEL
    this.leaderboardPanel = document.createElement("div");
    this.leaderboardPanel.className =
      "flex-1 w-4/5 h-96 standard-dialog flex flex-col gap-2";
    const results = document.createElement("h1");
    results.textContent = "leaderboard";
    this.leaderboardPanel.appendChild(results);
    this.leftPanel = this.leaderboardPanel;
    this.chatRow.appendChild(this.leftPanel);
    const leaderboardResults = document.createElement("div");
    leaderboardResults.className =
      "grid grid-cols-2 gap-2 p-2 w-full my-3 overflow-y-auto";
    this.leaderboardPanel.appendChild(leaderboardResults);
    this.leaderboardData.forEach((user) => {
      const resultBox = document.createElement("div");
      resultBox.className =
        "flex flex-row gap-2 box standard-dialog w-full items-center";
      if (user.color && user.colormap) {
        const avatar = new ProfileAvatar(
          user.color,
          user.colormap,
          30,
          30,
          2,
        ).getElement();
        resultBox.appendChild(avatar);
      }
      const username = document.createElement("h1");
      if (user.username) {
        username.textContent = user.username;
        username.className = "truncate flex-1 min-w-0 ml-2";
      }
      resultBox.appendChild(username);
      const userScore = document.createElement("h1");
      userScore.textContent = `wins: ${user.wins}`;
      resultBox.appendChild(userScore);
      leaderboardResults.appendChild(resultBox);
    });

    // CHATPANEL
    this.chatPanel = document.createElement("div");
    this.chatPanel.className =
      "flex-1 w-4/5 h-96 standard-dialog flex flex-col";
    // information bar "chat with" information button
    const informationBar = document.createElement("div");
    informationBar.className = "flex flex-row pb-2";
    const informationText = document.createElement("h1");
    informationText.textContent = `chat with ${user.username}`;
    informationBar.appendChild(informationText);
    const informationIcon = new InformationIcon(() =>
      this.toggleProfilePopUp(user),
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

    // add friends panel (toggles on add friend)
    this.addFriendsPanel = document.createElement("div");
    this.addFriendsPanel.className =
      "flex-1 w-4/5 h-96 standard-dialog flex flex-col";
    // search function for friends
    const friendsInputBox = document.createElement("div");
    friendsInputBox.className =
      "flex flex-row gap-2 w-full pt-2 items-center px-2";
    this.addFriendsPanel.appendChild(friendsInputBox);
    this.searchInput = document.createElement("input");
    this.searchInput.className = "w-4/5 rounded h-10";
    this.searchInput.type = "text";
    this.searchInput.style.paddingLeft = "0.5em";
    this.searchInput.placeholder = "search";
    friendsInputBox.appendChild(this.searchInput);
    const searchButton = document.createElement("button");
    searchButton.textContent = "search";
    searchButton.className =
      "btn flex items-center justify-center text-center h-10 w-1/5";
    searchButton.onclick = () => this.searchButtonHook();
    friendsInputBox.appendChild(searchButton);
    // search results add friends
    this.searchResults = document.createElement("div");
    this.searchResults.className =
      "grid grid-cols-3 gap-2 p-2 w-full my-3 overflow-y-auto";
    this.addFriendsPanel.appendChild(this.searchResults);
    this.populateAddFriends(this.allUserData);

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
    this.sendButton.onclick = () => this.chatStuff();

    this.inputBox.appendChild(this.inputMessage);
    this.inputBox.appendChild(this.sendButton);
    this.bottomBar = this.inputBox;
    this.chatPanel.appendChild(this.bottomBar);
    // set input box as initial buttom bar

    // default profile pop up that shows our own profile at start
    this.profilePopUp = new ProfilePopUp(
      () => this.toggleProfilePopUp(user),
      user,
    ).getNode();
    this.rightPanel = this.profilePopUp;
    this.chatRow.appendChild(this.rightPanel);

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

  // toggles invite (in messages)
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

  // PANELS:

  // function to correctly switch the left panel
  private replaceLeftPanel(newPanel: HTMLDivElement) {
    // remove current left panel if it's in the DOM
    if (this.chatRow.contains(this.leftPanel)) {
      this.chatRow.removeChild(this.leftPanel);
      // remove clicked contact styling in case user clicks any other button outside of clicked contact
      if (this.leftPanel == this.chatPanel) {
        this.clickedContact.classList.remove("bg-black");
        this.clickedContact.classList.remove("text-white");
      }
    }
    this.leftPanel = newPanel;
    // always insert before rightPanel if it exists, else append
    if (this.chatRow.contains(this.rightPanel)) {
      this.chatRow.insertBefore(this.leftPanel, this.rightPanel);
    } else {
      this.chatRow.appendChild(this.leftPanel);
    }
  }

  // leaderboard panel: left panel type
  private toggleLeaderboardPanel(): void {
    this.replaceLeftPanel(this.leaderboardPanel);
  }

  // chat panel: left panel type
  private toggleChatPanel(contact: HTMLDivElement): void {
    this.replaceLeftPanel(this.chatPanel);

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

  // add friend panel: left panel type
  private toggleAddFriendPanel(): void {
    this.replaceLeftPanel(this.addFriendsPanel);
  }

  // right side panel (only type that populates right side panel as of rn)
  private toggleProfilePopUp(user: User): void {
    // remove profile pop up if it is already shown on screen
    if (this.profilePopUp && this.chatRow.contains(this.rightPanel)) {
      this.chatRow.removeChild(this.rightPanel);
      return;
    }

    // create new popup and show it
    if (user.userId === this.backend.getUser().userId) {
      // case is pop up for local user
      this.profilePopUp = new ProfilePopUp(
        () => this.toggleProfilePopUp(user),
        user,
      ).getNode();
    } else {
      this.profilePopUp = new ProfilePopUp(
        () => this.toggleProfilePopUp(user),
        user,
        "friend",
      ).getNode();
    }
    this.rightPanel = this.profilePopUp;
    this.chatRow.appendChild(this.rightPanel);
  }

  // HOOKS:

  private searchButtonHook(): void {
    // release toggle
    const searchValue = this.searchInput.value.toLowerCase().trim();
    this.searchResults.innerHTML = "";
    // Filter users based on search value
    const filteredUsers = this.allUserData.filter((user) => 
      user.username.toLowerCase().includes(searchValue),
    );
    // populate with filtered results, or show all if search is empty
    const usersToShow = searchValue === "" ? this.allUserData : filteredUsers;
    this.populateAddFriends(usersToShow);
  }

  private populateAddFriends(userList: UsersAll): void {
    userList.forEach((friend) => {
      // skip yourself (cant add yourself)
      if (friend.userId !== this.backend.getUser().userId) {
        const contact = document.createElement("div");
        contact.className =
          "flex flex-row gap-2 box standard-dialog w-full items-center";
        const clickableContact = document.createElement("a");
        clickableContact.onclick = () => this.toggleProfilePopUp(friend);
        clickableContact.style.cursor = "pointer";
        const contactName = document.createElement("h1");
        contactName.textContent = friend.username;
        contactName.className = "truncate flex-1 min-w-0";
        const contactAvatar = new ProfileAvatar(
          friend.color,
          friend.colormap,
          30,
          30,
          2,
        ).getElement();
        clickableContact.appendChild(contact);
        contact.appendChild(contactAvatar);
        contact.appendChild(contactName);
        this.searchResults.appendChild(clickableContact);
      }
    });
  }

  // standard mount unmount:

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.container.remove();
  }
}
