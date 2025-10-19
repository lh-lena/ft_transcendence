import { ServiceContainer, Backend, Websocket, Router } from "../../services";
import { Window } from "../../components/window";
import {
  CANVAS_DEFAULTS,
  FriendsList,
  UsersAll,
  BlockedList,
  ChatHistory,
} from "../../types";
import { MenuBar } from "../../components/menuBar";
import { ProfileAvatar } from "../../components/profileAvatar";
import { InformationIcon } from "../../components/informationIcon";
import { ProfilePopUp } from "../../components/profilePopUp";
import { FriendsIcon } from "../../components/friendsIcon";
import { Leaderboard } from "../../types/leaderboard";
import { profilePrintToArray } from "../../utils/profilePrintFunctions";
import { User } from "../../types";
import { ReceivedChatMessage } from "../../types/websocket";
import { showError, showSuccess } from "../../components/toast";
import { userWinsLosses } from "../../types/backend";

export class ChatPage {
  // jesus christ this is an ugly piece of shieeet
  private serviceContainer: ServiceContainer;
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
  private blockedList!: BlockedList;
  private searchResults!: HTMLDivElement;
  private offlineheader!: HTMLElement;
  private onlineheader!: HTMLElement;
  private contacts!: HTMLDivElement;
  private friends!: HTMLDivElement;
  private websocket: Websocket;
  private currentChatHistory!: ChatHistory;
  private messageNotificationTimeout?: number;
  private router: Router;

  constructor(serviceContainer: ServiceContainer) {
    // router / services container
    this.serviceContainer = serviceContainer;
    this.backend = this.serviceContainer.get<Backend>("backend");
    this.websocket = this.serviceContainer.get<Websocket>("websocket");
    this.router = this.serviceContainer.get<Router>("router");
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
    // friends fetch
    const initFriendsList: FriendsList =
      await instance.backend.fetchFriendsById(
        instance.backend.getUser().userId,
      );
    for (const element of initFriendsList) {
      const userResponse = await instance.backend.fetchUserById(
        element.friendUserId,
      );
      element.username = userResponse.data.username;
      element.colormap = profilePrintToArray(userResponse.data.colormap);
      element.color = userResponse.data.color;
      element.avatar = userResponse.data.avatar;
      element.online = userResponse.data.online;
    }
    instance.friendsList = initFriendsList;
    // blocked list fetch
    instance.blockedList = await instance.backend.getBlockedListById(
      instance.backend.getUser().userId,
    );

    // // register WebSocket handlers after connection is established
    instance.websocket.onMessage("chat_message", (payload) => {
      instance.handleChatIncomingMessage(payload);
    });

    // Complete the UI setup
    instance.setupUI();

    return instance;
  }

  private async setupUI() {
    const user: User = this.backend.getUser();

    // main container
    this.container = document.createElement("div");
    this.container.className =
      "w-full min-h-screen flex flex-col items-center justify-center bg-brandBlue";

    // MENU BAR TOP
    const menuBar = new MenuBar(this.serviceContainer, "friends").render();

    // main chat row
    this.chatRow = document.createElement("div");
    this.chatRow.className = "flex flex-row w-full gap-3";

    // contacts panel
    const contactsPanel = document.createElement("div");
    contactsPanel.className = "flex-shrink-0 w-1/5 h-96 flex flex-col";
    this.contacts = document.createElement("div");
    this.contacts.className =
      "flex flex-col gap-2 w-full overflow-y-auto flex-1 pr-2";
    contactsPanel.appendChild(this.contacts);
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
      user.avatar ? "image" : undefined,
      user.userId,
    ).getElement();
    addYouButton.appendChild(youButtonAvatar);
    const addYouButtonText = document.createElement("h1");
    addYouButtonText.textContent = user.username;
    addYouButton.appendChild(addYouButtonText);
    clickableYoubutton.appendChild(addYouButton);
    clickableYoubutton.onclick = () => this.toggleProfilePopUp(user);
    this.contacts.appendChild(clickableYoubutton);

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
    this.contacts.appendChild(clickableLeaderboardbutton);

    // FRIENDS ICON: adds seperation to collumn
    const friendsHeaderRow = document.createElement("div");
    friendsHeaderRow.className =
      "flex flex-row gap-2 mb-2 justify-center items-center";
    const friendsIcon = new FriendsIcon();
    friendsHeaderRow.appendChild(friendsIcon.getNode());
    const friendsHeader = document.createElement("h1");
    friendsHeader.textContent = "friends";
    friendsHeaderRow.appendChild(friendsHeader);
    this.contacts.appendChild(friendsHeaderRow);

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
    this.contacts.appendChild(clickableAddFriendButton);

    this.onlineheader = document.createElement("h1");
    this.onlineheader.className = "text-center text-emerald-800";
    this.offlineheader = document.createElement("h1");
    this.offlineheader.className = "text-center text-red-800";
    this.contacts.appendChild(this.onlineheader);
    this.contacts.appendChild(this.offlineheader);

    // CONTACTS
    this.friends = document.createElement("div");
    this.friends.className = "flex flex-col gap-2 w-full flex-1";
    this.contacts.appendChild(this.friends);
    this.populateFriends();

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
    // only try stuff on leaderboard data if array greater than 0
    if (this.leaderboardData.length > 0) {
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
            user.avatar ? "image" : undefined,
            user.userId,
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
    }

    // CHATPANEL
    this.chatPanel = document.createElement("div");
    this.chatPanel.className =
      "flex-1 w-4/5 h-96 standard-dialog flex flex-col";
    this.populateChatPanel(user);

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

    // get user stats from backend
    const userStats: userWinsLosses = await this.backend.fetchUserStatsById(
      user.userId,
    );
    console.log(userStats);

    // default profile pop up that shows our own profile at start
    this.profilePopUp = new ProfilePopUp(
      () => this.toggleProfilePopUp(user),
      user,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      userStats,
    ).getNode();
    this.rightPanel = this.profilePopUp;
    // this.chatRow.appendChild(this.rightPanel);

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

  private async populateChatPanel(user: User) {
    // clear old chatpanel
    this.chatPanel.innerHTML = "";
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
    this.currentChatHistory = await this.backend.fetchChatHistoryByIds(
      this.backend.getUser().userId,
      user.userId,
    );
    this.currentChatHistory.forEach((message) => {
      const messageBox = document.createElement("div");
      messageBox.className = "standard-dialog flex items-center self-start";
      const messageText = document.createElement("h1");
      messageText.textContent = message.message;
      if (message.senderId == this.backend.getUser().userId) {
        messageBox.classList.add("!self-end");
        messageBox.classList.add("bg-black");
        messageBox.classList.add("text-white");
      }
      messageBox.appendChild(messageText);
      messages.appendChild(messageBox);
    });

    // scroll to bottom after DOM has updated
    setTimeout(() => {
      messages.scrollTop = messages.scrollHeight;
    }, 0);

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
    this.sendButton.onclick = () =>
      this.sendHook(user, this.inputMessage.value);
    this.inputBox.appendChild(this.inputMessage);
    this.inputBox.appendChild(this.sendButton);
    this.bottomBar = this.inputBox;
    this.chatPanel.appendChild(this.bottomBar);
  }

  private async populateFriends() {
    // Clear existing friends first
    this.friends.innerHTML = "";

    for (const friend of this.friendsList) {
      const isBlocked = this.blockedList.some((blockedUser) => {
        return blockedUser.blockedUserId === friend.friendUserId;
      });
      if (isBlocked) continue;

      const clickableContact = document.createElement("a");
      clickableContact.style.cursor = "pointer";
      clickableContact.className = "w-full";

      const contact = document.createElement("div");
      contact.className =
        "flex flex-row gap-2 box standard-dialog w-full items-center";

      const userResponse = await this.backend.fetchUserById(
        friend.friendUserId,
      );
      const user: User = userResponse.data;
      user.friendId = friend.friendId;
      user.colormap = profilePrintToArray(userResponse.data.colormap);
      clickableContact.onclick = () => this.toggleChatPanel(contact, user);

      const contactName = document.createElement("h1");
      contactName.textContent = friend.username;

      if (friend.color && friend.colormap) {
        const contactAvatar = new ProfileAvatar(
          friend.color,
          friend.colormap,
          30,
          30,
          2,
          friend.avatar ? "image" : undefined,
          user.userId,
        ).getElement();

        contact.appendChild(contactAvatar);
        contact.appendChild(contactName);
        clickableContact.appendChild(contact);

        // insert logic for online offline
        if (friend.online) {
          this.friends.appendChild(clickableContact);
        } else {
          this.friends.appendChild(clickableContact);
        }
      }
    }

    // Now handle the headers and reorder elements
    const onlineFriends: HTMLElement[] = [];
    const offlineFriends: HTMLElement[] = [];

    // Separate online and offline friends
    Array.from(this.friends.children).forEach((element, index) => {
      const friendData = this.friendsList.find((_, i) => {
        const isBlocked = this.blockedList.some((blockedUser) => {
          return blockedUser.blockedUserId === this.friendsList[i].friendUserId;
        });
        return !isBlocked;
      });

      if (
        friendData &&
        this.friendsList[index] &&
        this.friendsList[index].online
      ) {
        onlineFriends.push(element as HTMLElement);
      } else {
        offlineFriends.push(element as HTMLElement);
      }
    });

    // Clear and rebuild with proper order
    this.friends.innerHTML = "";

    // Add online header if we have online friends
    if (onlineFriends.length > 0) {
      this.onlineheader.textContent = "online:";
      this.onlineheader.className = "text-center text-emerald-800";
      this.friends.appendChild(this.onlineheader);
      onlineFriends.forEach((friend) => this.friends.appendChild(friend));
    } else {
      this.onlineheader.innerHTML = "";
      this.onlineheader.className = "";
    }

    // Add offline header if we have offline friends
    if (offlineFriends.length > 0) {
      this.offlineheader.textContent = "offline:";
      this.offlineheader.className = "text-center text-red-800";
      this.friends.appendChild(this.offlineheader);
      offlineFriends.forEach((friend) => this.friends.appendChild(friend));
    } else {
      this.offlineheader.innerHTML = "";
      this.offlineheader.className = "";
    }
  }

  // toggles invite (in messages)
  private toggleInvitePrompt(): void {
    // toggle profile popup shut when we want to send invite (otherwise looks ugly asf)
    if (
      this.chatRow.contains(this.rightPanel) &&
      this.rightPanel === this.profilePopUp
    )
      this.toggleProfilePopUp(this.backend.getUser());
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
      "standard-dialog roded flex items-center w-4/5 h-10";
    const sendInviteText = document.createElement("h1");
    sendInviteText.textContent = "invite to game?";
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
  private toggleChatPanel(contact: HTMLDivElement, user?: any): void {
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

    // populate new chat panel with new user
    if (user) this.populateChatPanel(user);
  }

  // add friend panel: left panel type
  private toggleAddFriendPanel(): void {
    this.replaceLeftPanel(this.addFriendsPanel);
  }

  // right side panel (only type that populates right side panel as of rn)
  // watch out -> could be a friend thats passed or a user
  private async toggleProfilePopUp(user: any, close?: boolean) {
    // remove profile pop up if it is already shown on screen
    if (this.profilePopUp && this.chatRow.contains(this.rightPanel)) {
      this.chatRow.removeChild(this.rightPanel);
      if (close) return;
    }

    let isFriend = false;
    let isBlocked = false;
    let friendID = -1;
    let blockedFriendId = -1;
    // Check if user is a friend and get the friendId
    const friendRecord = this.friendsList.find(
      (friend) => friend.friendUserId === user.userId,
    );
    if (friendRecord) {
      isFriend = true;
      friendID = friendRecord.friendId;
      isBlocked = this.blockedList.some((blockedUser) => {
        return blockedUser.blockedUserId === friendRecord.friendUserId;
      });
      if (isBlocked) {
        const blockedFriend = this.blockedList.find(
          (friend) => friend.blockedUserId === friendRecord.friendUserId,
        );
        if (blockedFriend) blockedFriendId = blockedFriend?.blockedId;
      }
    }

    if (user.userId === this.backend.getUser().userId && !user.friendId) {
      // get user stats from backend
      const userStats: userWinsLosses = await this.backend.fetchUserStatsById(
        user.userId,
      );
      // console.log(userStats);
      // case is pop up for local user
      this.profilePopUp = new ProfilePopUp(
        () => this.toggleProfilePopUp(user, true),
        user,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        userStats,
      ).getNode();
      // case user is friend
    } else {
      const userStats: userWinsLosses = await this.backend.fetchUserStatsById(
        user.userId,
      );
      this.profilePopUp = new ProfilePopUp(
        () => this.toggleProfilePopUp(user, true),
        user,
        "friend",
        () => this.addFriendHook(user.userId),
        () => this.blockFriendsHook(user.userId),
        isFriend,
        () => this.removeFriendHook(friendID),
        isBlocked,
        () => this.unblockFriendCallback(blockedFriendId),
        userStats,
      ).getNode();
    }
    this.rightPanel = this.profilePopUp;
    this.chatRow.appendChild(this.rightPanel);
  }

  private async unblockFriendCallback(blockedId: number) {
    await this.backend.unblockUserByBlockedId(blockedId);
    await this.refreshBlockedList();
    await this.refreshFriendsList();
    this.toggleProfilePopUp(this.backend.getUser());
  }

  private async removeFriendHook(friendId: number) {
    await this.backend.removeFriendByFriendId(friendId);
    await this.refreshFriendsList();
    this.toggleProfilePopUp(this.backend.getUser());
  }

  private async blockFriendsHook(userId: string) {
    await this.backend.blockUserByIds(this.backend.getUser().userId, userId);
    await this.refreshBlockedList();
    await this.refreshFriendsList();
    this.toggleProfilePopUp(this.backend.getUser());
  }

  private async refreshBlockedList() {
    this.blockedList = await this.backend.getBlockedListById(
      this.backend.getUser().userId,
    );
  }

  private async addFriendHook(userId: string) {
    await this.backend.addFriendByIds(this.backend.getUser().userId, userId);
    await this.refreshFriendsList();
    // close on add friend
    this.toggleProfilePopUp(this.backend.getUser());
  }

  private async refreshFriendsList() {
    const initFriendsList = await this.backend.fetchFriendsById(
      this.backend.getUser().userId,
    );
    // clear friends
    this.friends.innerHTML = "";
    // fetch user stuff for the friends
    for (const element of initFriendsList) {
      const userResponse = await this.backend.fetchUserById(
        element.friendUserId,
      );
      element.username = userResponse.data.username;
      element.colormap = profilePrintToArray(userResponse.data.colormap);
      element.color = userResponse.data.color;
      element.avatar = userResponse.data.avatar;
      element.online = userResponse.data.online;
    }
    this.friendsList = initFriendsList;
    this.populateFriends();
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
          friend.avatar ? "image" : undefined,
          friend.userId,
        ).getElement();
        clickableContact.appendChild(contact);
        contact.appendChild(contactAvatar);
        contact.appendChild(contactName);
        this.searchResults.appendChild(clickableContact);
      }
    });
  }

  private async sendHook(user: User, message: string) {
    // invite case
    if (this.inputBox.contains(this.sendInvite)) {
      const response = await this.backend.joinGame();
      console.log(response);
      this.router.navigate("/vs-player", {
        gameType: "remote",
        source: "invite",
        gameId: response.gameId,
      });
    }

    if (message.trim() === "") return; // don't send empty messages
    if (message.length > 200) {
      showError("only messages up to 200 characters permitted");
      return;
    }
    await this.websocket.sendChatMessage(user, message);
    // wait 700 miliseconds after updating database
    // testing bump up to 700
    await new Promise((resolve) => setTimeout(resolve, 1270));
    await this.populateChatPanel(user);
    this.inputMessage.value = ""; // clear the input after sending
  }

  private async handleChatIncomingMessage(payload: ReceivedChatMessage) {
    const userResponse = await this.backend.fetchUserById(payload.senderId);
    const user: User = userResponse.data;
    // clear existing timeout and set a new one
    // makes sure we dont spam showSuccess if we get multiple from web socket
    if (this.messageNotificationTimeout) {
      clearTimeout(this.messageNotificationTimeout);
    }
    this.messageNotificationTimeout = setTimeout(() => {
      showSuccess(`message from ${user.username}`);
    }, 500);

    await this.populateChatPanel(user);
  }

  // standard mount unmount:

  public mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  public unmount(): void {
    this.container.remove();
  }
}
