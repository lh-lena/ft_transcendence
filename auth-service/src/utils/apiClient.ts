import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';

/**
 * Backend API Client Configuration
 *
 * Creates an axios instance configured for communication with the backend service.
 * Includes automatic retry logic with exponential backoff for transient failures.
 *
 * Features:
 * - 5 second timeout per request
 * - 3 automatic retries with exponential backoff (1s, 2s, 3s)
 * - Only retries on network errors and idempotent requests (GET, PUT, DELETE)
 * - Does NOT retry on 4xx client errors
 */

/**
 * Axios instance for backend API communication
 * Base URL is set from environment variable with fallback to Docker service name
 */
const backendApi: AxiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://backend:8080/api',
  timeout: 5000,

  validateStatus: (status) => status < 500,
});

/**
 * Retry configuration for transient failures
 * Uses exponential backoff: 1s, 2s, 3s delays between retries
 */
const retryConfig: IAxiosRetryConfig = {
  retries: 3,

  /**
   * @param retryCount - Current retry attempt number (1-based)
   * @returns Delay in milliseconds before next retry
   */
  retryDelay: (retryCount: number) => {
    return retryCount * 1000;
  },

  /**
   * Determine if request should be retried
   * @param error - Axios error object
   * @returns true if request should be retried
   */
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
};

axiosRetry(backendApi, retryConfig);

/**
 * Make an API request to the backend service
 *
 * Handles errors gracefully and provides typed responses.
 * All requests automatically include retry logic for transient failures.
 *
 * @template T - Expected response data type
 * @param config - Axios request configuration
 * @returns Promise resolving to response data of type T
 * @throws {Error} If request fails after all retry attempts
 *
 * @example
 * // GET request
 * const user = await apiClientBackend<User>({
 *   method: 'GET',
 *   url: '/user/123'
 * });
 *
 * @example
 * // POST request with body
 * const newUser = await apiClientBackend<User>({
 *   method: 'POST',
 *   url: '/user',
 *   data: { username: 'john', }
 * });
 */
export async function apiClientBackend<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await backendApi.request<T>(config);

    if (response.status >= 400) {
      throw new Error(`Backend API error: ${response.status} - ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to backend service at ${backendApi.defaults.baseURL}. ` +
            'Ensure the backend service is running.',
        );
      }

      if (axiosError.code === 'ETIMEDOUT') {
        throw new Error(
          `Request to ${config.url} timed out after ${backendApi.defaults.timeout}ms`,
        );
      }

      if (axiosError.response) {
        throw new Error(
          `Backend API error: ${axiosError.response.status} - ` +
            `${axiosError.response.statusText}`,
        );
      }

      throw new Error(`Network error: ${axiosError.message}`);
    }

    throw error;
  }
}

/**
 * Export axios instance for advanced use cases
 * (e.g., adding interceptors, accessing instance directly)
 */
export { backendApi };
