import { z } from 'zod';

const matchStatusBase = z.enum([ 'PENDING', 'ACTIVE', 'FINISHED', 'CANCELED' ]);
const matchStatusSchema = matchStatusBase.meta( { $id: 'matchStatus' } );

const matchHistoryIn = z.object({
  status:              matchStatusBase,
  matchId:             z.string().uuid(),
  player1Id:           z.number(),
  player2Id:           z.number(),
  player1Score:        z.number().optional(),
  player2Score:        z.number().optional(),
  winnerId:            z.number().optional(),
  loserId:             z.number().optional(),
}

const matchHistoryGen = z.object({
  id:                   z.number(),
  startedAt:            z.string(),
  endendAt:             z.string(),
}

const matchHistoryBase = z.object({
  ...matchHistoryIn,
  ...matchHistoryGen,
}

const matchHistorySchema = matchHistoryBase.meta( { $id: 'matchHistory' } );
const matchHistorySchemaArray = z.array( matchHistoryBase ).meta( { $id: 'matchHistoryArray' } );



