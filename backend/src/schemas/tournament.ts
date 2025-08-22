import { z } from 'zod/v4';
import { status } from './basics';
import { userBase } from './user';

const tournamentBase = z.object({
  tournamentId: z.uuid(),
  players: z.array(userBase),
  status: status,
});
const tournament = tournamentBase.meta({ $id: 'tournament' });

//define Post schema
const tournamentCreateBase = tournamentBase.pick({
  players: true,
});
const tournamentCreate = tournamentCreateBase.meta({ $id: 'tournamentCreate' });

const tournamentIdBase = tournamentBase.pick({
  tournamentId: true,
});
const tournamentId = tournamentIdBase.meta({ $id: 'tournamentId' });

const tournamentResponse = tournamentBase.meta({ $id: 'tournamentResponse' });

export const tournamentSchemas = [tournament, tournamentCreate, tournamentId, tournamentResponse];

export type tournamentType = z.infer<typeof tournament>;
export type tournamentCreateType = z.infer<typeof tournamentCreate>;
export type tournamentIdType = z.infer<typeof tournamentId>;
export type tournamentResponseType = z.infer<typeof tournamentResponse>;
