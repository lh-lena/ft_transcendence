import { Prisma } from '@prisma/client';
import {  gamePlayed, user } from '@prisma/client';
import { resultCreateInput, resultResponseType } from '../../schemas/result';

import { gamePlayedType } from '../../schemas/gamePlayed';
import { user as userType } from '../../schemas/user';

export async function transformInput(
  data: resultCreateInput,
): Promise<Prisma.resultCreateInput> {
  const gamePlayed = [];

  if (data.winnerId !== null && data.winnerId !== -1) {
    gamePlayed.push({
      user: { connect: { id: data.winnerId } },
      score: data.scorePlayer1 ? data.scorePlayer1 : -1,
      isWinner: true,
    });
  }

  if (data.loserId !== null && data.loserId !== -1) {
    gamePlayed.push({
      user: { connect: { id: data.loserId } },
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

async function transformGamePlayed(gp: gamePlayed): Promise<gamePlayedType> {
  return {
    id: gp.id,
    userId: gp.userId ?? undefined,
    user: gp.user
      ? {
          id: gp.user.id,
          email: gp.user.email,
          username: gp.user.username,
          password_hash: gp.user.password_hash,
          is_2fa_enabled: gp.user.is_2fa_enabled,
          twofa_secret: gp.user.twofa_secret ?? undefined,
          createdAt: gp.user.createdAt,
          updatedAt: gp.user.updatedAt,
        }
      : undefined,
    score: gp.score ?? undefined,
    isWinner: gp.isWinner ?? undefined,
  };
}

export async function transformOutput(
  prismaResult: resultResponseType,
): Promise<resultResponseType> {
  const gamePlayed = await Promise.all(
    prismaResult.gamePlayed.map(transformGamePlayed),
  );
  return {
    id: prismaResult.id,
    gameId: prismaResult.gameId,
    status: prismaResult.status,
    startedAt: prismaResult.startedAt.toISOString(),
    finishedAt: prismaResult.finishedAt.toISOString(),
    gamePlayed: gamePlayed,
  };

