import axios from "axios";
import { User, UserRegistration } from "../types";

export class Backend {
  private user: User | undefined;
  private api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 10000,
  });

  constructor() {
    // Add request interceptor for auth tokens
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async registerUser(data: UserRegistration) {
    console.log(data);
    const response = await this.api.post("/user", data);
    return response.data;
  }

  // example API calls
  async getUser() {
    return this.user;
  }

  async fetchAllUsers() {
    const response = await this.api.get("user");
    return response;
  }

  async refreshUser() {
    if (!this.user?.id) {
      throw new Error("User ID is undefined");
    }
    const response = await this.getUserById(this.user.id);
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
}
