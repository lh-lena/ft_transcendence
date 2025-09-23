import axios from "axios";

export class Auth {
  private api = axios.create({
    baseURL: import.meta.env.VITE_AUTH_URL,
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

  // `POST /api/auth/register`
  async registerUser(body: Record<string, unknown>) {
    const response = await this.api.post("/api/auth/register", body);
    return response.data;
  }
}
