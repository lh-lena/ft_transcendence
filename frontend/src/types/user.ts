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
export type User = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  username: string;
  password_hash: string;
  tfaEnabled: boolean;
  twofa_secret: string;
  guest: boolean;
  color: string;
  colormap: string[];
  avatar: string | null;
  online?: string;
};

export type UsersAll = User[];
