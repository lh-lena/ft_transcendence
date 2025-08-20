import { z } from 'zod/v4';
import { userBase } from './user';
import { status } from './basics';

const tournamentPlayer = z.object({
  alias: z.string(),
  user: userBase.optional(),
  id: z.number(),
});

const tournamentBase = z.object({
  tournamentId: z.uuid(),
  players: z.array(tournamentPlayer),
  status: status,
});
const tournament = tournamentBase.meta({ $id: 'tournament' });

const tournamentJoinBase = tournamentPlayer.pick({
  alias: true,
  user: true,
});
const tournamentJoin = tournamentJoinBase.meta({ $id: 'tournamentJoin' });
