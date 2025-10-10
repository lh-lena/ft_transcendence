import axios from "axios";
import { User, UserLogin, UserRegistration } from "../types";

// utils
import {
  generateProfilePrint,
  profilePrintToArray,
  profilePrintToString,
} from "../utils/profilePrintFunctions";
import { showError } from "../components/toast";

export class Backend {
  private user!: User;
  private refreshTries: number = 0;

  private api = axios.create({
    baseURL: import.meta.env.VITE_AUTH_URL,
    timeout: 10000,
    withCredentials: true,
  });

  constructor() {
    this.setupInterceptors();
    this.loadUserFromStorage();
  }

  //-------------Interceptors for handling responses and errors--------------
  private setupInterceptors() {
    this.api.interceptors.response.use(
      (response) => {
        console.log("API Response:", response.data);
        this.refreshTries = 0;
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        console.log("og request", originalRequest);

        //if 401 try retry
        if (error.response?.status === 401 && this.refreshTries < 1) {
          try {
            this.refreshTries++;
            await this.refreshToken();
            await this.api(originalRequest);
          } catch {
            console.log("Refresh token failed, logging out!");
            localStorage.removeItem("user");
            document.cookie = "jwt=";
            document.cookie = "refreshToken=";
            return;
          }
        } else if (error.response?.status === 401) {
          this.refreshTries++;
          document.cookie = "jwt=";
          document.cookie = "refreshToken=";
          console.log("Refresh token failed, logging out!");
          localStorage.removeItem("user");
          return;
        }

        // handle the rest of the errors
        console.error("API Error:", error.response?.data || error.message);
        showError("Error: " + (error.response?.data?.message || error.message));
        return;
      },
    );
  }

  //private startPeriodicRefreshToken() {
  //  this.stopPeriodicRefreshToken();

  //  this.refreshInterval = setInterval(
  //    async () => {
  //      try {
  //        await this.refreshToken();
  //      } catch {
  //        console.log("Periodic refresh failed, logging out!");
  //        this.logout();
  //      }
  //    },
  //    14 * 60 * 1000,
  //  );
  //}

  //////TODO call this on logout -> done and call this on websocket connection loss
  //private stopPeriodicRefreshToken() {
  //  if (this.refreshInterval) {
  //    clearInterval(this.refreshInterval);
  //    this.refreshInterval = undefined;
  //  }
  //}

  async refreshToken() {
    const response = await this.api.post("/api/refresh");
    return response;
  }

  //-------------Check Auth----------------
  async checkAuth(): Promise<string | null> {
    try {
      const token = localStorage.getItem("jwt");

      const userId = await this.api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return userId.data.userId;
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
    return response;
  }

  async deleteAcc() {
    await this.api.delete(`/api/user/${this.getUser().userId}`);
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

    return response;
  }

  //delete game eg on ingame quit or on waiting screen
  async deleteGame(gameId: string) {
    const response = await this.api.delete(`/api/game/${gameId}`);
    return response;
  }

  // --------Tournament API calls--------

  //join a tournament --> if user is loged in alias gets updated and if guest, guest account gets created. returns -> tournamentId: uuid, round: number, playerAmount: number, players: [userId: uuid], status: string(waiting, ready, finished), games: [gameSchema]

  async joinTournament(alias: string) {
    // console.log("Joining tournament", this.getUser());
    if (!this.getUser()) {
      await this.registerGuest(alias);
    } else {
      await this.api.patch(`/api/user/${this.getUser().userId}`, {
        alias: alias,
      });
    }

    const userId = this.getUser().userId;
    // console.log(userId);
    const response = await this.api.post("/api/tournament", {
      playerAmount: 4,
      userId: userId,
    });

    return response;
  }

  //leave tournament -> user gets deleted from the tournament
  async leaveTournament() {
    await this.api.post(`/api/tournament/leave/${this.getUser().userId}`);
  }

  async getGameHistory(userId: string) {
    const response = await this.api.get(`/api/users/${userId}/games`);
    return response.data;
  }

  // Match-related API calls
  async getMatchHistory(userId: string) {
    const response = await this.api.get(`/api/users/${userId}/matches`);
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

    //TODO cut ws connection
    try {
      await this.api.post("/api/logout");
      // console.log("Logged out:", response.data);
    } catch {
      console.error("Logout failed, but local data is cleared anyway");
    }

    localStorage.removeItem("user");
    //TODO how to navigate in here
    //this.router.navigate("/");

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

  //TODO add to websocket handler -> checks if still authentictaed and if start refresh
  async handleWsConnect() {
    //const isAuth = await this.checkAuth();
    //if (isAuth && this.user) {
    //  this.startPeriodicRefreshToken();
    //}
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
