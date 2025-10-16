import axios, { AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

const backendApi = axios.create({
  baseURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://backend:8080/api',
  timeout: 5000,
});

axiosRetry(backendApi, {
  retries: 3,
  retryDelay: (retryCount: number) => {
    return retryCount * 1000;
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
});

export async function apiClientBackend<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const response = await backendApi.request<T>(config);
  return response.data;
}
