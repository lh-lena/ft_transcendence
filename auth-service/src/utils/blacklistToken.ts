import { apiClientBackend } from '../utils/apiClient';
import { AxiosRequestConfig } from 'axios';

export async function isBlacklistedToken(token: string): Promise<boolean> {
  const config: AxiosRequestConfig = {
    method: 'get',
    url: `/blacklist`,
    params: { token },
  };

  const res: { blacklisted: boolean } = await apiClientBackend(config);
  return res.blacklisted;
}
