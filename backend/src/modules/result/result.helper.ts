import { Prisma } from '@prisma/client';
import { resultCreateInput } from '../../schemas/result';

export async function transformInput(
  data: resultCreateInput,
): Promise<Prisma.resultCreateInput> {
  const gamePlayed = [];

  if (data.winnerId !== null && data.winnerId !== -1) {
    gamePlayed.push({
      user: { connect: { id: data.winnerId } },
      userId: data.winnerId,
      score: data.scorePlayer1 ? data.scorePlayer1 : -1,
      isWinner: true,
    });
  }

  if (data.loserId !== null && data.loserId !== -1) {
    gamePlayed.push({
      user: { connect: { id: data.loserId } },
      userId: data.loserId,
      score: data.scorePlayer2 ? data.scorePlayer2 : -1,
      isWinner: false,
    });
  }

  return {
    gameId: data.gameId,
    status: data.status,
    startedAt: new Date(data.startedAt),
    finishedAt: new Date(data.finishedAt),
    gamePlayed: { create: gamePlayed },
  };
}
