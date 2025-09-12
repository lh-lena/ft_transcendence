import { apiClientBackend } from '../utils/apiClient';

export async function isBlacklistedToken(token: string): Promise<boolean> {
  const res = await apiClientBackend.get('/auth/blacklist', { params: { token } });
  return res.data.blacklisted;
}
