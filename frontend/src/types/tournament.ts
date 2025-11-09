export interface Player {
  userId: string;
  alias?: string;
  color?: string;
  colormap?: string[];
  avatar?: string | undefined;
}

export interface TournamentData {
  tournamentId: string;
  round: number;
  playerAmount: number;
  players: Player[];
  status: string;
  games: any[]; // You can make this more specific when you know the game structure
}
