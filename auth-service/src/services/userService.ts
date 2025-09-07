import axios from 'axios';
import { UserRecord } from '../schemas';

export async function loadUserByEmail(email: string): Promise<UserRecord | undefined> {
  const res = await apiClientBackend.get<UserRecord[]>('/user', { params: { email } });
  const user = res.data?.[0];
  if (user) user.is_2fa_enabled = Boolean(user.is_2fa_enabled);
  return user;
}

export async function loadUserById(id: number): Promise<UserRecord> {
  const res = await apiClientBackend.get<UserRecord>(`/user/${id}`);
  const user = res.data;
  user.is_2fa_enabled = Boolean(user.is_2fa_enabled);
  return user;
}

export async function isBlacklisted(token: string): Promise<boolean> {
  const res = await apiClientBackend.get('/auth/blacklist', { params: { token } });
  return res.data.blacklisted;
}

export { apiClientBackend };
