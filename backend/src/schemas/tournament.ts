import { z } from 'zod/v4';
import { status } from './basics';
import { userInfo } from './user';
import { gameBase } from './game';

const tournamentBase = z.object({
  tournamentId: z.uuid(),
  round: z.number().default(1),
  playerAmount: z.number().min(4).max(32).default(4),
  players: z.array(userInfo),
  status: status,
  games: z.array(gameBase),
});
const tournament = tournamentBase.meta({ $id: 'tournament' }).describe('Tournament object');

//define Post schema
const tournamentCreateBase = tournamentBase
  .pick({
    playerAmount: true,
  })
  .extend({
    playerId: z.number(),
  });
const tournamentCreate = tournamentCreateBase
  .meta({ $id: 'tournamentCreate' })
  .describe(
    'Tournament creation, with playerId of the creator, and optional playerAmount (4-32, default 4).',
  );

const tournamentIdBase = tournamentBase.pick({
  tournamentId: true,
});
const tournamentId = tournamentIdBase.meta({ $id: 'tournamentId' });

const tournamentResponse = tournamentBase.meta({ $id: 'tournamentResponse' });

export const tournamentSchemas = [tournament, tournamentCreate, tournamentId, tournamentResponse];

export type tournamentType = z.infer<typeof tournamentBase>;
export type tournamentCreateType = z.infer<typeof tournamentCreate>;
export type tournamentResponseType = z.infer<typeof tournamentResponse>;
