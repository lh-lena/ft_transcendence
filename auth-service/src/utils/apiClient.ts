import axios, { AxiosRequestConfig } from 'axios';
import axiosRetry from 'axios-retry';

const backendApi = axios.create({
  baseURL: process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/api` 
    : 'http://backend:8080/api', 
  timeout: 5000,
});

axiosRetry(backendApi, {
  retries: 3,
  retryDelay: (retryCount: number) => {
    return retryCount * 1000;
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 400;
  },
});

export async function apiClientBackend<T = any>(config: AxiosRequestConfig): Promise<T> {
  try {
    console.log('Axios Request: ', config);
    const response = await backendApi.request<T>(config);
    console.log('Axios Response: ', response.data);
    return response.data;
  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      console.error('API request to ', config.url, 'failed: ', err.message);
    }
    throw err;
  }
}
