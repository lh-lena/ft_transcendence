import axios, { AxiosRequestConfig } from 'axios';

const backendApi = axios.create({
  baseURL: 'http://127.0.0.1:8080/api',
  timeout: 5000,
});

export async function apiClientBackend<T = any>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await backendApi.request<T>(config);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('API request failed:', err);
    }
    throw err;
  }
}
