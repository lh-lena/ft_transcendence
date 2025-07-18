import { z } from 'zod/v4';

const matchStatusBase = z.enum([ 'finished', 'canceled' ]);
const matchStatusSchema = matchStatusBase.meta( { $id: 'matchHistoryStatus' } );

const matchModeBase = z.enum([ 'pvp_remote', 'pvp_ai', 'tournament' ]);
const matchModeSchema = matchModeBase.meta( { $id: 'matchMode' } );

const matchHistoryBase = z.object({
  id:                   z.string().uuid(),
  startedAt:            z.string(),
  endedAt:             z.string().optional(),
  status:              matchStatusBase,
  mode:                matchModeBase,
  player1Id:           z.number(),
  player2Id:           z.number(),
  player1Score:        z.number().optional(),
  player2Score:        z.number().optional(),
  winnerId:            z.number().optional(),
  loserId:             z.number().optional(),
} );

const matchHistorySchema = matchHistoryBase.meta( { $id: 'matchHistory' } );
const matchHistorySchemaArray = z.array( matchHistoryBase ).meta( { $id: 'matchHistoryArray' } );

const matchHistoryQerySchema = matchHistoryBase.partial().meta( { $id: 'matchHistoryQuery' } );

const matchHistoryIdBase = z.object({
  id: z.string().uuid(),
});
const matchHistoryIdSchema = matchHistoryIdBase.meta( { $id: 'matchHistoryId' } );

const matchHistoryCreateBase = matchHistoryBase.omit( { id: true, startedAt: true } );
const matchHistoryCreateSchema = matchHistoryCreateBase.meta( { $id: 'matchHistoryCreate' } );

const matchHistoryUpdateBase = matchHistoryBase.partial().omit( { id: true  } );
const matchHistoryUpdateSchema = matchHistoryUpdateBase.meta( { $id: 'matchHistoryUpdate' } );

const matchHistoryDeleteBase = z.object({
  message: z.string(),
});
const matchHistoryDeleteSchema = matchHistoryDeleteBase.meta( { $id: 'matchHistoryDelete' } );

export const matchHistorySchemas = [
  matchHistoryIdSchema,
  matchStatusSchema,
  matchModeSchema,
  matchHistorySchema,
  matchHistorySchemaArray,
  matchHistoryQerySchema,
  matchHistoryCreateSchema,
  matchHistoryUpdateSchema,
  matchHistoryDeleteSchema,
]
