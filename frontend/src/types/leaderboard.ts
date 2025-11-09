type LeaderboardEntry = {
  userId: string;
  wins: number;
  username?: string;
  avatar?: string;
  colormap?: string[];
  color?: string;
};

export type Leaderboard = LeaderboardEntry[];
