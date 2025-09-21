import axios from "axios";
import { User, UserLogin, UserRegistration } from "../types";

// utils
import {
  generateProfilePrint,
  profilePrintToArray,
  profilePrintToString,
} from "../utils/profilePrintFunctions";

export class Backend {
  private user!: User;
  private api = axios.create({
    baseURL: import.meta.env.VITE_AUTH_URL,
    timeout: 10000,
  });

  constructor() {
    // Add request interceptor for auth tokens
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("jwt");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // add response interceptor to handle errors globally
    this.api.interceptors.response.use(
      (response) => {
        // If response is successful (2xx status codes), return it
        return response;
      },
      (error) => {
        // Handle any response that isn't 2xx
        // only go in here if we are able to refresh token
        if (
          error.response?.status === 401 &&
          !(error.response?.data?.message === "refresh token expired") &&
          localStorage.getItem("refreshToken")
        ) {
          this.refreshToken();
        } else {
          console.error("API Error:", error.response?.data || error.message);
          alert(`
            backend error: ${error.response?.data?.message || error.message}`);
          // You can add specific error handling logic here
          // if (error.response?.status === 401) {
          //   // Handle unauthorized - maybe redirect to login
          //   localStorage.removeItem("jwt");
          //   localStorage.removeItem("user");
          // }
        }
        return Promise.reject(error);
      },
    );

    // if user exists grab old user form storage
    this.loadUserFromStorage();
  }

  async refreshToken() {
    localStorage.removeItem("jwt");
    const response = await this.api.post("/api/refresh", {
      refreshToken: localStorage.getItem("refreshToken"),
    });
    localStorage.setItem("jwt", response.data.jwt);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    return response;
  }

  async registerUser(data: UserRegistration) {
    let response = await this.api.post("/api/register", data);
    console.log(response);

    // save JWT token if it's returned in the response
    if (response.data.jwt && response.data.userId) {
      localStorage.setItem("jwt", response.data.jwt);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      const userResponse = await this.fetchUserById(response.data.userId);
      this.setUser(userResponse.data);
    }

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
    console.log(response);
    localStorage.setItem("jwt", response.data.jwt);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    const userResponse = await this.fetchUserById(response.data.userId);
    this.setUser(userResponse.data);

    return response;
  }

  // -----------Login API calls-----------

  async loginUser(data: UserLogin) {
    const response = await this.api.post("/api/login", data);
    console.log(response);
    // return early if 2fa case
    if (response.data.status === "2FA_REQUIRED") return response;
    localStorage.setItem("jwt", response.data.jwt);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    const userResponse = await this.fetchUserById(response.data.userId);
    this.setUser(userResponse.data);
  }

  async fetchUserById(userId: string) {
    const response = await this.api.get(`/api/user/${userId}`);
    return response;
  }

  // example API calls
  getUser() {
    return this.user;
  }

  setUser(response: User) {
    console.log(response);
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
    if (!this.user?.userId) {
      throw new Error("User ID is undefined");
    }
    const response = await this.getUserById(this.user.userId);
    this.user = response;
  }

  async getUserById(userId: string) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  // Game-related API calls
  async createGame(gameConfig: any) {
    console.log("Creating game with config:", gameConfig);
    const response = await this.api.post("/games", gameConfig);
    return response.data;
  }

  async changePasswordById(userId: string, newPassword: string) {
    const response = await this.api.patch(`/api/user/${userId}`, {
      password: newPassword,
    });
    return response;
  }

  //create a game vs ai return game data with gameId for olena
  async createAiGame(userId: string, aiDifficulty: string) {
    const response = await this.api.post("/games", {
      userId: userId,
      mode: "pvb_ai",
      aiDifficulty: aiDifficulty,
      visibility: "private",
    });
    return response.data;
  }

  //joins random game -> if another game is matched status = ready and gameId for olena
  //if status not ready user is in waiting line -> loadingscreen?
  async joinGame(userId: string, gameId: string) {
    let payload = { userId: userId } as { userId: string; gameId?: string };
    if (gameId) payload.gameId = gameId;
    const response = await this.api.post(`/game/join`, {
      userId: userId,
      gameId: gameId,
    });
    return response;
  }

  //create a private game to invite over chat -> if status ready send gameId to olena
  async createPrivateGame(userId: string) {
    const response = await this.api.post("/games", {
      userId,
      mode: "pvp_remote",
      visibility: "private",
    });

    return response;
  }

  //delete game eg on ingame quit or on waiting screen
  async deleteGame(gameId: string) {
    const response = await this.api.delete(`/games/${gameId}`);
    return response;
  }

  // --------Tournament API calls--------

  //join a tournament --> if user is loged in alias gets updated and if guest, guest account gets created. returns -> tournamentId: uuid, round: number, playerAmount: number, players: [userId: uuid], status: string(waiting, ready, finished), games: [gameSchema]

  async joinTournament(alias: string) {
    if (!this.user) {
      await this.registerGuest(alias);
    } else {
      await this.api.patch(`/user/${this.user.userId}`, {
        alias: alias,
      });
    }

    const userId = this.user.userId;

    const response = await this.api.post("/tournament", {
      playerAmount: 4,
      userId: userId,
    });

    return response;
  }

  //leave tournament -> user gets deleted from the tournament
  async leaveTournament() {
    if (this.user) {
      await this.api.post(`/tournament/leave/${this.user.userId}`);
    }
  }

  async getGameHistory(userId: string) {
    const response = await this.api.get(`/users/${userId}/games`);
    return response.data;
  }

  // Match-related API calls
  async getMatchHistory(userId: string) {
    const response = await this.api.get(`/users/${userId}/matches`);
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
    const response = await this.api.post("/api/logout", {
      refreshToken: localStorage.getItem("refreshToken"),
    });
    console.log(response);
    localStorage.removeItem("jwt");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return response;
  }

  async twoFaTOTP(userId: string) {
    const response = await this.api.post("/api/tfaSetup", {
      userId: userId,
      type: "totp",
    });
    console.log(response);
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
    if (response.status != 200) return response;
    localStorage.setItem("jwt", response.data.jwt);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    const userResponse = await this.fetchUserById(response.data.userId);
    this.setUser(userResponse.data);
    return response;
  }
  // async fetchBlockedUsersById(userId: string) {

  // }

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
