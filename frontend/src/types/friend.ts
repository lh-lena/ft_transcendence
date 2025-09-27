export type FriendsList = {
  username: string;
  userId: string;
  friendId: number;
  friendUserId: string;
  color?: string;
  colormap?: string[];
  avatar: string;
  online?: boolean;
}[];
