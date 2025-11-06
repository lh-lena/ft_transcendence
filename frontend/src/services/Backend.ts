import axios from "axios";
import { EventBus } from "./EventBus";
import { User, UserLogin, UserRegistration } from "../types";

// utils
import {
  generateProfilePrint,
  profilePrintToArray,
  profilePrintToString,
} from "../utils/profilePrintFunctions";
import { showError, showSuccess } from "../components/toast";

export class Backend {
  private user!: User;
  private refreshed: boolean = false;
  private eventBus: EventBus;

  private api = axios.create({
    baseURL: import.meta.env.VITE_AUTH_URL,
    timeout: 10000,
    withCredentials: true,
  });

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupInterceptors();
    this.loadUserFromStorage();
  }

  //-------------Interceptors for handling responses and errors--------------
  private setupInterceptors() {
    this.api.interceptors.response.use(
      (response) => {
        console.log("API Response:", response.data);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        //if 401 try retry
        if (
          error.response?.status === 401 &&
          !this.refreshed &&
          error.response.data.message === "TOKEN_INVALID_OR_EXPIRED"
        ) {
          try {
            console.log("Refresh try for tokens");
            this.refreshed = true;
            const response = await this.refreshToken();

            localStorage.setItem("jwt", response.data.jwt);

            const userResponse = await this.fetchUserById(response.data.userId);
            this.setUser(userResponse.data);

            this.refreshed = false;

            return await this.api(originalRequest);
          } catch {
            localStorage.removeItem("user");
            document.cookie = "jwt=";
            document.cookie = "refreshToken=";
            // push logout to event bus
            this.eventBus.emit("auth:logout");
            return;
          }
        } else if (error.response?.status && this.refreshed) {
          localStorage.removeItem("user");
          document.cookie = "jwt=";
          document.cookie = "refreshToken=";
          //TODO move to login page
          return;
        }

        // handle the rest of the errors
        console.error(
          "API Error:",
          error.response?.data || error.message,
          "With request: ",
          error.config,
        );
        showError(error.response.data.message.toLowerCase());
        return;
      },
    );
  }

  async refreshToken() {
    const response = await this.api.post("/api/refresh");
    console.log("Refreshed token:", response.data.jwt);
    localStorage.setItem("jwt", response.data.jwt);
    console.log("Token refreshed successfully", localStorage.getItem("jwt"));

    return response;
  }

  //-------------Check Auth----------------
  async checkAuth(): Promise<{ userId: string; role: string } | null> {
    try {
      const token = localStorage.getItem("jwt");
      console.log(token);

      const userId = await this.api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (userId.status !== 200) return null;
      const user = await this.fetchUserById(userId.data.userId);
      if (user.status !== 200) return null;
      this.setUser(user.data);
      return userId.data;
    } catch {
      return null;
    }
  }

  //--------------Registration----------------
  async registerUser(data: UserRegistration) {
    let response = await this.api.post("/api/register", data);

    const userResponse = await this.fetchUserById(response.data.userId);
    localStorage.setItem("jwt", response.data.jwt);
    this.setUser(userResponse.data);

    return response;
  }

  //TODO connect to websocket
  async registerGuest(alias: string) {
    const { color, colorMap } = generateProfilePrint();
    const response = await this.api.post("/api/guest/login", {
      alias: alias,
      color: color,
      colormap: profilePrintToString(colorMap),
    });

    const userResponse = await this.fetchUserById(response.data.userId);
    localStorage.setItem("jwt", response.data.jwt);
    this.setUser(userResponse.data);

    return response;
  }

  // -----------Login API calls-----------

  async loginUser(data: UserLogin) {
    const response = await this.api.post("/api/login", data);

    // return early if 2fa case
    if (response.data.status === "2FA_REQUIRED") {
      return response;
    }
    localStorage.setItem("jwt", response.data.jwt);

    const userResponse = await this.fetchUserById(response.data.userId);
    this.setUser(userResponse.data);

    return response;
  }

  // ------------OAuth2--------------
  oAuth2Login(): Promise<any> {
    return new Promise((resolve, reject) => {
      const authUrl = `${import.meta.env.VITE_AUTH_URL}/api/oauth`;

      const popup = window.open(
        authUrl,
        "oauth",
        "width=600,height=600,scrollbars=yes,resizable=yes,centerscreen=yes",
      );
      if (!popup) {
        reject(new Error("Failed to open popup"));
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        // console.log("Message received:", event);
        // console.log("Expected origin:", window.location.origin);
        // console.log("Event origin:", event.origin);
        if (event.origin !== `${import.meta.env.VITE_AUTH_URL}`) {
          return;
        }

        const { type, data } = event.data;

        if (type === "OAUTH_RESULT") {
          // console.log(type, data);
          window.removeEventListener("message", messageHandler);

          if (!popup.closed) {
            popup.close();
          }

          resolve(data);
        }
      };

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageHandler);
          reject(new Error("OAuth popup was closed"));
        }
      }, 1000);

      window.addEventListener("message", messageHandler);
    });
  }

  async fetchUserById(userId: string) {
    const response = await this.api.get(`/api/user/${userId}`);
    return response;
  }

  async fetchUserStatsById(userId: string) {
    const response = await this.api.get(`/api/result/stats/${userId}`);
    console.log("Stats: ", response.data);
    return response.data;
  }

  // example API calls
  getUser(): User {
    return this.user;
  }

  setUser(response: User) {
    // console.log(response);
    this.user = response;
    this.user = {
      ...response,
      colormap:
        typeof response.colormap === "string"
          ? profilePrintToArray(response.colormap)
          : response.colormap, // keep existing if already processed
    };

    // save to local
    this.saveUserToStorage();
  }

  async fetchFriendsById(userId: string) {
    const response = await this.api.get("/api/friend", {
      params: {
        // fetch friends using user id we've stored locally
        userId: userId,
      },
    });
    return response.data;
  }

  async addFriendByIds(userId: string, friendId: string) {
    const response = await this.api.post("/api/friend", {
      userId: userId,
      friendUserId: friendId,
    });
    return response;
  }

  async removeFriendByFriendId(friendId: number) {
    const response = await this.api.delete(`/api/friend/${friendId}`);
    return response;
  }

  async blockUserByIds(userId: string, blockedUserId: string) {
    const response = await this.api.post("/api/blocked", {
      userId: userId,
      blockedUserId: blockedUserId,
    });
    return response;
  }

  async unblockUserByBlockedId(blockedId: number) {
    const response = await this.api.delete(`/api/blocked/${blockedId}`);
    return response;
  }

  async fetchChatHistoryByIds(userId: string, friendId: string) {
    const response = await this.api.get("/api/chat", {
      params: {
        senderId: userId,
        recieverId: friendId,
      },
    });
    return response.data;
  }

  async getBlockedListById(userId: string) {
    const response = await this.api.get("/api/blocked", {
      params: {
        userId: userId,
      },
    });
    return response.data;
  }

  async fetchAllUsers() {
    const response = await this.api.get("/api/user");
    return response;
  }

  async refreshUser() {
    const response = await this.getUserById(this.getUser().userId);
    this.user = response;
  }

  async getUserById(userId: string) {
    const response = await this.api.get(`/api/user/${userId}`);
    return response.data;
  }

  // Game-related API calls
  async createGame(gameConfig: any) {
    // console.log("Creating game with config:", gameConfig);
    const response = await this.api.post("/api/game", gameConfig);
    return response.data;
  }

  async changePasswordById(userId: string, newPassword: string) {
    const response = await this.api.patch(`/api/user/${userId}`, {
      password: newPassword,
    });
    if (response.status === 200 || response.status === 201) {
      showSuccess("Password Changed Successfully");
    }
    return response;
  }

  async changeUsernameById(userId: string, newUsername: string) {
    const response = await this.api.patch(`/api/user/${userId}`, {
      username: newUsername,
    });
    if (response.status === 200 || response.status === 201) {
      showSuccess("Username Changed Successfully");
    }
    return response;
  }

  async deleteAcc() {
    await this.api.delete(`/api/user/${this.getUser().userId}`);
    showSuccess("Account Deleted");
    this.logout();
  }

  //TODO add upload limit
  async uploadAvatar(avatar: File) {
    const formData = new FormData();
    formData.append("avatar", avatar);

    const response = await this.api.post("/api/upload", formData);

    const avatarUrl = response.data.storedName;
    // console.log(avatarUrl);

    const response2 = await this.api.patch(
      `/api/user/${this.getUser().userId}`,
      {
        avatar: avatarUrl,
      },
    );

    if (response2.status === 200 || response2.status === 201)
      showSuccess("Avatar Uploaded");

    return response2.data;
  }

  async getAvatar(userId: string) {
    const response = await this.api.get(`/api/avatar/${userId}`);
    return response.data;
  }

  //create a game vs ai return game data with gameId for olena
  async createAiGame(aiDifficulty: string) {
    const response = await this.api.post("/api/game", {
      userId: this.getUser().userId,
      mode: "pvb_ai",
      aiDifficulty: aiDifficulty,
      visibility: "private",
    });
    return response.data;
  }

  //joins random game -> if another game is matched status = ready and gameId for olena
  //if status not ready user is in waiting line -> loadingscreen?
  async joinGame(gameId?: string) {
    let payload = { userId: this.getUser().userId } as {
      userId: string;
      gameId?: string;
    };

    if (gameId) {
      payload.gameId = gameId;
    }

    console.log("payload", payload);

    const response = await this.api.post(`/api/game/join`, payload);

    return response.data;
  }

  //create a private game to invite over chat -> if status ready send gameId to olena
  async createPrivateGame(userId: string) {
    const response = await this.api.post("/api/game", {
      userId,
      mode: "pvp_remote",
      visibility: "private",
    });

    return response.data;
  }

  //delete game eg on ingame quit or on waiting screen
  async deleteGame(gameId: string) {
    const response = await this.api.delete(`/api/game/${gameId}`);
    return response;
  }

  async getGameById(gameId: string) {
    const response = await this.api.get(`/api/game/${gameId}`);
    return response;
  }

  async getGameByUser() {
    const userId = this.getUser().userId;

    const response = await this.api.get(`/api/game/user/${userId}`);
    return response.data;
  }

  // --------Tournament API calls--------

  //join a tournament --> if user is loged in alias gets updated and if guest, guest account gets created. returns -> tournamentId: uuid, round: number, playerAmount: number, players: [userId: uuid], status: string(waiting, ready, finished), games: [gameSchema]

  async joinTournament(alias: string, userType?: string) {
    if (userType === "registered") {
      await this.api.patch(`/api/user/${this.getUser().userId}`, {
        alias: alias,
      });
    }

    const userId = this.getUser().userId;
    const response = await this.api.post("/api/tournament", {
      playerAmount: 4,
      userId: userId,
    });

    return response;
  }

  async getTournamentById(tournamentId: string) {
    const response = await this.api.get(`/api/tournament/${tournamentId}`);
    return response;
  }

  //leave tournament -> user gets deleted from the tournament
  async leaveTournament() {
    const userId = this.getUser().userId;
    console.log("Leaving tournament for user:", userId);
    await this.api.delete(`/api/tournament/leave/${userId}`);
  }

  async getGameHistory(userId: string) {
    const response = await this.api.get(`/api/users/${userId}/games`);
    return response.data;
  }

  // Match-related API calls
  async getMatchHistory(userId: string) {
    const response = await this.api.get(`/api/result/${userId}`);
    return response.data;
  }

  // get leaderboard results
  async getLeaderboard() {
    const response = await this.api.get(`/api/result/leaderboard`);
    return response.data;
  }

  // local storage magic

  private saveUserToStorage() {
    if (this.user) {
      localStorage.setItem("user", JSON.stringify(this.user));
    }
  }

  async logout() {
    //this.stopPeriodicRefreshToken();
    // need to do this before we await smt
    localStorage.removeItem("user");
    localStorage.removeItem("jwt");

    // need to block here to make sure we have deleted everything
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    //TODO cut ws connection
    try {
      await this.api.post("/api/logout");
    } catch {
      console.error("Logout failed, but local data is cleared anyway");
    }

    return;
  }

  async twoFaTOTP(userId: string) {
    const response = await this.api.post("/api/tfaSetup", {
      userId: userId,
      type: "totp",
    });
    // console.log(response);
    return response;
  }

  //TODO:: make type depending on the code length -> backupcode > 6
  async verify2FARegCode(userId: string, sessionId: string, code: string) {
    const response = await this.api.post("/api/verify", {
      userId: userId,
      sessionId: sessionId,
      type: "totp",
      code: code,
    });

    // console.log("2FA Verification Response:", response.data);

    if (response.status === 200) {
      const userResponse = await this.fetchUserById(response.data.userId);
      this.setUser(userResponse.data);
    }

    return response;
  }

  //TODO:: make type depending on the code length -> backupcode > 6
  async verify2FARecoveryCode(userId: string, sessionId: string, code: string) {
    const response = await this.api.post("/api/verify", {
      userId: userId,
      sessionId: sessionId,
      type: "backup",
      code: code,
    });

    // console.log("2FA Verification Response:", response.data);

    if (response.status === 200) {
      const userResponse = await this.fetchUserById(response.data.userId);
      this.setUser(userResponse.data);
    }

    return response;
  }

  //TODO add to websokcet handler -> when connection brakes to stop refresh loop
  handleWsConnectionLoss() {
    //this.stopPeriodicRefreshToken();
  }

  private loadUserFromStorage() {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch (error) {
        console.error("Failed to parse saved user data:", error);
        localStorage.removeItem("user");
      }
    }
  }

  // delete user from local storage is handled in router directly on /logout call
}

export async function getAvatar(userId: string) {
  const response = await fetch(
    `${import.meta.env.VITE_AUTH_URL}/api/avatar/${userId}`,
    { method: "get" },
  );
  if (response.status === 200) return response.blob();
  else null;
}
