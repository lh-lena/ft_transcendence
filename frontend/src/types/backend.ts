export type userWinsLosses = {
  userId: string;
  wins: number;
  loses: number;
};

// need to display date, score, winner
export interface MatchHistoryEntry {
  finishedAt: string;
  gameId: string;
  loserId: string;
  loserScore: number;
  resultId: number;
  startedAt: string;
  status: string;
  winnerId: string;
  winnerScore: number;
}

export type MatchHistoryData = MatchHistoryEntry[];
