import axios, { AxiosRequestConfig } from 'axios';

const backendApi = axios.create({
  baseURL: 'http://127.0.0.1:8080/api',
  timeout: 5000,
});

export async function apiClientBackend<T = any>(config: AxiosRequestConfig): Promise<T> {
  try {
    console.log('Axios Request: ', config);
    const response = await backendApi.request<T>(config);
    console.log('Axios Response: ', response.data);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error('API request to ', config.url, 'failed: ', err.message);
    }
    throw err;
  }
}
