import { Prisma, result } from '@prisma/client';
import type { resultType, resultCreateInput } from '../../schemas/result';

export async function transformInput(
  data: resultCreateInput,
): Promise<Prisma.resultCreateInput> {
  const gamePlayed: Prisma.gamePlayedCreateWithoutResultInput[] = [];

  const addPlayer = (userId: number, score: number, isWinner: boolean) => {
    gamePlayed.push({
      user: { connect: { id: userId } },
      score: score,
      isWinner,
    });
  };

  addPlayer(data.winnerId, data.scorePlayer1, true);
  addPlayer(data.loserId, data.scorePlayer2, false);

  return {
    gameId: data.gameId,
    status: data.status,
    startedAt: new Date(data.startedAt),
    finishedAt: new Date(data.finishedAt),
    gamePlayed: { create: gamePlayed },
  };
}

export async function transformResult(result: result): Promise<resultType> {
  return {
    ...result,
    startedAt: result.startedAt.toISOString(),
    finishedAt: result.finishedAt.toISOString(),
  };
}
