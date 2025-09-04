export interface UserProfile {
  username: string;
  color: string;
  colorMap: string[];
}

export type UserRegistration = {
  email: string;
  username: string;
  password_hash: string;
  is_2fa_enabled: boolean;
  twofa_secret: string;
  guest: boolean;
  color: string;
  colormap: string;
  avatar: string;
};

export type User = {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  gamePlayed?: {
    some?: {
      id?: string;
      userId?: number;
      isWinner?: boolean;
      score?: number;
      gameId?: number;
    };
  };
  email?: string;
  username?: string;
  password_hash?: string;
  is_2fa_enabled?: boolean;
  twofa_secret?: string | null;
  guest?: boolean;
  color?: string;
  colormap?: string;
  avatar?: string | null;
};
