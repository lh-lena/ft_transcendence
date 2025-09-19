export interface UserProfile {
  username: string;
  color: string;
  colorMap: string[];
}

export type UserRegistration = {
  email: string;
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
  email: string;
  password: string;
};

// user obj we store locally -> notice we use a colormap array instead of string
export type UserLocal = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  username: string;
  password_hash: string;
  is_2fa_enabled: boolean;
  twofa_secret: string;
  guest: boolean;
  color: string;
  colormap: string[];
  avatar: string | null;
};

// user obj we get back from backend
export type UserResponse = {
  id: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  username: string;
  password_hash: string;
  is_2fa_enabled: boolean;
  twofa_secret: string;
  guest: boolean;
  color: string;
  colormap: string;
  avatar: string | null;
};

export type FriendsList = {
  id: number;
  userId: string;
  friendId: string;
}[];
