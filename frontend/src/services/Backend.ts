import axios from "axios";
import { FriendsList, User, UserLogin, UserRegistration } from "../types";

// utils
import { profilePrintToArray } from "../utils/profilePrintFunctions";

export class Backend {
  private user!: User;
  private friends!: FriendsList;
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
        console.log(`jwt: ${token}`);
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
        console.error("API Error:", error.response?.data || error.message);
        // You can add specific error handling logic here
        // if (error.response?.status === 401) {
        //   // Handle unauthorized - maybe redirect to login
        //   localStorage.removeItem("jwt");
        //   localStorage.removeItem("user");
        // }
        // Re-throw the error so individual methods can still catch it if needed
        return Promise.reject(error);
      },
    );

    // if user exists grab old user form storage
    this.loadUserFromStorage();
  }

  async registerUser(data: UserRegistration) {
    let response = await this.api.post("/api/register", data);
    console.log(response);

    // save JWT token if it's returned in the response
    if (response.data.jwt && response.data.userId) {
      localStorage.setItem("jwt", response.data.jwt);
      const userResponse = await this.fetchUserById(response.data.userId);
      this.setUser(userResponse.data);
    }

    return response;
  }

  async loginUser(data: UserLogin) {
    const response = await this.api.post("/api/login", data);
    localStorage.setItem("jwt", response.data.jwt);
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
    console.log(`user: ${userId}, friend: ${friendId}`);
    const response = await this.api.post("/api/friend", {
      params: {
        userId: userId,
        friendUserId: friendId,
      },
    });
    return response;
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
    const response = await this.api.post("/games", gameConfig);
    return response.data;
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
