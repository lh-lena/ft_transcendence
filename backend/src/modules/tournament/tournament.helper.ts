import { v4 as uuidv4 } from 'uuid';

export const createTournaments = () => {
  return [
    {
      tournamentId: uuidv4(),
      playerAmount: 4,
      players: [],
      round: 1,
      status: 'waiting',
      games: [],
    },
    {
      tournamentId: uuidv4(),
      playerAmount: 8,
      players: [],
      round: 1,
      status: 'waiting',
      games: [],
    },
    {
      tournamentId: uuidv4(),
      playerAmount: 16,
      players: [],
      round: 1,
      status: 'waiting',
      games: [],
    },
    {
      tournamentId: uuidv4(),
      playerAmount: 32,
      players: [],
      round: 1,
      status: 'waiting',
      games: [],
    },
  ];
};
