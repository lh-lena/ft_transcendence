import axios from "axios";
import {
  FriendsList,
  UserLocal,
  UserLogin,
  UserRegistration,
  UserResponse,
} from "../types";

// utils
import { profilePrintToArray } from "../utils/profilePrintFunctions";

export class Backend {
  private user!: UserLocal;
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
      response = await this.fetchUserById(response.data.userId);
      console.log(response);
    }

    return response;
  }

  async loginUser(data: UserLogin) {
    const response = await this.api.post("/api/login", data);
    localStorage.setItem("jwt", response.data.jwt);
    this.fetchUserById(response.data.userId);
  }

  async fetchUserById(userId: string) {
    const response = await this.api.get(`/api/user/${userId}`);

    // Extract user data from the array and map it to UserResponse format
    const userData: UserResponse = response.data;

    this.setUser(userData);

    return response;
  }

  // example API calls
  getUser() {
    return this.user;
  }

  setUser(response: UserResponse) {
    console.log(response);
    this.user = {} as UserLocal;
    this.user.userId = response.id;
    this.user.createdAt = response.createdAt;
    this.user.updatedAt = response.updatedAt;
    this.user.email = response.email;
    this.user.username = response.username;
    this.user.password_hash = response.password_hash;
    this.user.is_2fa_enabled = response.is_2fa_enabled;
    this.user.twofa_secret = response.twofa_secret;
    this.user.guest = response.guest;
    this.user.color = response.color;
    // take string color map to array
    this.user.colormap = profilePrintToArray(response.colormap);
    console.log(this.user.colormap);
    this.user.avatar = response.avatar;

    // save to local
    this.saveUserToStorage();
  }

  async fetchFriends() {
    const response = await this.api.get("/friend", {
      params: {
        // fetch friends using user id we've stored locally
        userId: this.user.userId,
      },
    });
    console.log(response);
    return response.data;
  }

  async fetchAllUsers() {
    const response = await this.api.get("user");
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
    const response = await this.api.get(`/result/leaderboard`);
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
