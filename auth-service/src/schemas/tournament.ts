import { z } from 'zod/v4';
import { userIdSchema } from './user';
import { gameSchema } from './game';

const tournamentSchema = z.object({
  tournamentId: z.uuid(),
  round: z.number(),
  playerAmount: z.number(),
  players: z.array(userIdSchema),
  status: z.string(),
  games: z.array(gameSchema),
});

export const tournamentIdSchema = tournamentSchema.pick({ tournamentId: true });
export const tournamentCreateSchema = tournamentSchema
  .pick({ playerAmount: true })
  .extend({ userId: true });

export type TournamentType = z.infer<typeof tournamentSchema>;
export type TournamentIdType = z.infer<typeof tournamentIdSchema>;
export type TournamentCreateType = z.infer<typeof tournamentCreateSchema>;
