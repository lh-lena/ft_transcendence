import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

export async function isBlacklistedToken(token: string): Promise<boolean> {
  const config: AxiosRequestConfig = {
    method: 'get',
    url: `/blacklist`,
    params: { token: token },
  };

  const res = await apiClientBackend(config);
  return res.blacklisted;
}
