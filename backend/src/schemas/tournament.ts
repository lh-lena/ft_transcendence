import { z } from 'zod/v4';
import { status } from './basics';
import { userInfo } from './user';

const tournamentBase = z.object({
  tournamentId: z.uuid(),
  playerAmount: z.number().min(4).max(32),
  players: z.array(userInfo),
  status: status,
  games: z.array(z.uuid()),
});
const tournament = tournamentBase.meta({ $id: 'tournament' });

//define Post schema
const tournamentCreateBase = z.object({
  userId: z.number(),
  playerAmount: z.number().min(4).max(32).default(4),
});
const tournamentCreate = tournamentCreateBase.meta({ $id: 'tournamentCreate' });

const tournamentIdBase = tournamentBase.pick({
  tournamentId: true,
});
const tournamentId = tournamentIdBase.meta({ $id: 'tournamentId' });

const tournamentResponse = tournamentBase.meta({ $id: 'tournamentResponse' });

export const tournamentSchemas = [tournament, tournamentCreate, tournamentId, tournamentResponse];

export type tournamentType = z.infer<typeof tournamentBase>;
export type tournamentCreateType = z.infer<typeof tournamentCreate>;
export type tournamentIdType = z.infer<typeof tournamentId>;
export type tournamentResponseType = z.infer<typeof tournamentResponse>;
