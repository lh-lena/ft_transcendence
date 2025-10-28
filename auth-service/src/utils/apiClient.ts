/**
 * Backend API Client Configuration (merged and normalized)
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry';
import { NormalizedError } from '../schemas/basics';

const DEFAULT_TIMEOUT_MS = 5000;
const RETRIES = 3;

/**
 * Axios instance for backend API communication
 */
const backendApi: AxiosInstance = axios.create({
  baseURL: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://backend:8080/api',
  timeout: DEFAULT_TIMEOUT_MS,
  validateStatus: (status: number) => status < 500,
});

/**
 * Retry configuration for transient failures
 * Exponential-ish backoff: 1s, 2s, 3s
 * Retries only on network errors or idempotent requests AND NOT on 4xx client errors.
 */
const retryConfig: IAxiosRetryConfig = {
  retries: RETRIES,
  retryDelay: (retryCount: number): number => retryCount * 1000,
  retryCondition: (error: AxiosError): boolean => {
    const status = error.response?.status;
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return false;
    }

    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
};

axiosRetry(backendApi, retryConfig);

/**
 * Normalize an unknown error into the NormalizedError shape the central error handler expects.
 */
export function normalizeAxiosError(err: unknown): NormalizedError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<unknown>;
    const resp: AxiosResponse<unknown> | undefined = axiosErr.response;
    const responseData = resp?.data;

    const proxiedData: unknown | undefined =
      typeof responseData === 'object' && responseData !== null ? responseData : undefined;

    const statusNum: number | undefined =
      typeof resp?.status === 'number' ? resp.status : undefined;

    const normalized: NormalizedError = {
      name: axiosErr.name ?? 'AxiosError',
      message:
        axiosErr.message ??
        (typeof proxiedData === 'object' &&
        proxiedData !== null &&
        'message' in (proxiedData as Record<string, unknown>)
          ? String((proxiedData as Record<string, unknown>).message)
          : 'Request to backend failed'),
      code: axiosErr.code,
      status: statusNum,
      statusCode: statusNum,
      response: {
        status: resp?.status,
        statusCode: (resp as unknown as { statusCode?: number })?.statusCode ?? resp?.status,
        data: proxiedData,
      },
      data: proxiedData ?? axiosErr.config ?? undefined,
      validation: (axiosErr as unknown as { validation?: unknown })?.validation,
      stack: axiosErr.stack,
    };

    return normalized;
  }

  if (err instanceof Error) {
    return {
      name: err.name ?? 'Error',
      message: err.message ?? 'An error occurred',
      stack: err.stack,
    };
  }

  return {
    name: 'Error',
    message: typeof err === 'string' ? err : 'An error occurred',
    data: err,
  };
}

/**
 * Make an API request to the backend service
 *
 */
export async function apiClientBackend<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await backendApi.request<T>(config);

    if (response.status >= 400) {
      const normalizedError: NormalizedError = {
        name:
          (response.data as unknown) &&
          typeof response.data === 'object' &&
          'error' in (response.data as Record<string, unknown>)
            ? String((response.data as Record<string, unknown>).error)
            : 'BackendError',
        message:
          (response.data as unknown) &&
          typeof response.data === 'object' &&
          'message' in (response.data as Record<string, unknown>)
            ? String((response.data as Record<string, unknown>).message)
            : `Backend API error: ${response.status} - ${response.statusText}`,
        status: response.status,
        statusCode: response.status,
        response: {
          status: response.status,
          statusCode: response.status,
          data: response.data,
        },
        data: response.data,
      };

      throw normalizedError;
    }

    return response.data as T;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<unknown>;

      if (axiosError.code === 'ECONNREFUSED') {
        const normalized: NormalizedError = {
          name: 'BackendConnectionError',
          message: `Cannot connect to backend service at ${backendApi.defaults.baseURL}. Ensure the backend service is running.`,
          code: axiosError.code ?? undefined,
          status: 502,
          statusCode: 502,
          response: {
            status: 502,
            statusCode: 502,
            data: axiosError.response?.data,
          },
          stack: axiosError.stack,
        };
        throw normalized;
      }

      if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
        const normalized: NormalizedError = {
          name: 'BackendTimeoutError',
          message: `Request to ${config.url ?? backendApi.defaults.baseURL} timed out after ${backendApi.defaults.timeout}ms`,
          code: axiosError.code ?? undefined,
          status: 504,
          statusCode: 504,
          response: {
            status: 504,
            statusCode: 504,
            data: axiosError.response?.data,
          },
          stack: axiosError.stack,
        };
        throw normalized;
      }

      if (axiosError.response) {
        const resp = axiosError.response;
        const normalized: NormalizedError = {
          name:
            typeof resp.data === 'object' &&
            resp.data !== null &&
            'error' in (resp.data as Record<string, unknown>)
              ? String((resp.data as Record<string, unknown>).error)
              : (axiosError.name ?? 'BackendError'),
          message:
            typeof resp.data === 'object' &&
            resp.data !== null &&
            'message' in (resp.data as Record<string, unknown>)
              ? String((resp.data as Record<string, unknown>).message)
              : `Backend API error: ${resp.status} - ${resp.statusText}`,
          code: axiosError.code ?? undefined,
          status: resp.status,
          statusCode: resp.status,
          response: {
            status: resp.status,
            statusCode: resp.status,
            data: resp.data,
          },
          data: resp.data,
          validation: (resp.data as unknown as { details?: unknown })?.details ?? undefined,
          stack: axiosError.stack,
        };
        throw normalized;
      }

      throw normalizeAxiosError(axiosError);
    }

    throw normalizeAxiosError(error);
  }
}

/**
 * Export axios instance for advanced use cases
 */
export { backendApi };

export default apiClientBackend;
