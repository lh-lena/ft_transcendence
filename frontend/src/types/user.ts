export interface UserProfile {
  username: string;
  color: string;
  colormap: string[];
}

export type UserRegistration = {
  email?: string;
  username: string;
  password: string;
  tfaEnabled?: string;
  twofa_secret?: string;
  guest?: string;
  color: string;
  colormap: string;
  avatar?: string;
};

export type UserLogin = {
  username: string;
  password: string;
};

// user obj we store locally -> notice we use a colormap array instead of string
export type User = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  username: string;
  alias: string;
  password_hash: string;
  tfaEnabled: boolean;
  twofa_secret: string;
  guest: boolean;
  color: string;
  colormap: string[];
  avatar: string | null;
  online?: string;
  friendId?: number;
  winsAndLosses?: Map<string, number>;
};

export type UsersAll = User[];
