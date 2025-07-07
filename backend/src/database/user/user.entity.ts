
export interface user {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  is_2fa_enabled: boolean;
  twofa_secret?: string | null;
  created_at: string;
  updated_at: string;
}
