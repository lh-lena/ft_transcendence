import { Prisma, Result } from '@prisma/client';
import type { resultType, resultCreateType } from '../../schemas/result';

export async function transformInput(data: resultCreateType): Promise<Prisma.ResultCreateInput> {
  const gamePlayed: Prisma.GamePlayedCreateWithoutResultInput[] = [];

  const addPlayer = (userId: string, score: number, isWinner: boolean) => {
    gamePlayed.push({
      user: { connect: { id: userId } },
      score: score,
      isWinner,
    });
  };

  const winnerScore = Math.max(data.scorePlayer1, data.scorePlayer2);
  const loserScore = Math.min(data.scorePlayer1, data.scorePlayer2);

  addPlayer(data.winnerId, winnerScore, true);
  addPlayer(data.loserId, loserScore, false);

  return {
    gameId: data.gameId,
    status: data.status,
    startedAt: new Date(data.startedAt),
    finishedAt: new Date(data.finishedAt),
    gamePlayed: { create: gamePlayed },
  };
}

export async function transformResult(result: Result): Promise<resultType> {
  return {
    ...result,
    startedAt: result.startedAt.toISOString(),
    finishedAt: result.finishedAt.toISOString(),
  };
}
