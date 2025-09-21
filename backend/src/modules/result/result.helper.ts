import { Prisma } from '@prisma/client';
import type { resultCreateType, resultResponseType } from '../../schemas/result';
import type { gamePlayedType } from '../../schemas/shared';

type options = { include: { gamePlayed: true } };
type ResultWithGP = Prisma.ResultGetPayload<options>;

export async function transformInput(data: resultCreateType): Promise<Prisma.ResultCreateInput> {
  const gamePlayed: Prisma.GamePlayedCreateWithoutResultInput[] = [];

  const addPlayer = (userId: string, score: number, isWinner: boolean) => {
    gamePlayed.push({
      user: { connect: { userId: userId } },
      score: score,
      isWinner,
    });
  };

  const winnerScore = Math.max(data.scorePlayer1, data.scorePlayer2);
  const loserScore = Math.min(data.scorePlayer1, data.scorePlayer2);

  addPlayer(data.winnerId, winnerScore, true);
  addPlayer(data.loserId, loserScore, false);

  const started = !isNaN(Number(data.startedAt))
    ? new Date(Number(data.startedAt))
    : new Date(data.startedAt);

  const finished = !isNaN(Number(data.finishedAt))
    ? new Date(Number(data.finishedAt))
    : new Date(data.finishedAt);

  return {
    gameId: data.gameId,
    status: data.status,
    startedAt: started,
    finishedAt: finished,
    gamePlayed: { create: gamePlayed },
  };
}

export function transformResult(result: ResultWithGP): resultResponseType {
  const winner = result.gamePlayed.find((gp: gamePlayedType) => gp.isWinner);
  const loser = result.gamePlayed.find((gp: gamePlayedType) => !gp.isWinner);
  return {
    resultId: result.resultId,
    gameId: result.gameId,
    startedAt: result.startedAt.toISOString(),
    finishedAt: result.finishedAt.toISOString(),
    status: result.status,
    winnerId: winner?.userId,
    loserId: loser?.userId,
    winnerScore: winner?.score,
    loserScore: loser?.score,
  };
}

export function transformResultArray(resultArray: ResultWithGP[]): resultResponseType[] {
  return resultArray.map(transformResult);
}
