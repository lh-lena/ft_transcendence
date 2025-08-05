import { Prisma } from '@prisma/client';
import { createCrud } from '../../utils/prismaCrudGenerator';

import { NotFoundError, ConflictError } from '../../utils/error';

import {
  result,
  resultCreateInput,
  resultResponseType,
  resultResponseArrayType,
} from '../../schemas/result';

const resultModel = createCrud('result');
const options = { include: { gamePlayed: { include: { user: true } } } };

async function transformData(
  data: resultCreateInput,
): Promise<Prisma.resultCreateInput> {
  const gamePlayed = [];

  if (data.winnerId !== null && data.winnerId !== -1) {
    gamePlayed.push({
      user: { connect: { id: data.winnerId } },
      score: data.scorePlayer1,
      isWinner: true,
      isAi: false,
    });
  } else if (data.winnerId === -1) {
    gamePlayed.push({
      score: data.scorePlayer1,
      isWinner: true,
      isAi: true,
    });
  }

  if (data.loserId !== null && data.loserId !== -1) {
    gamePlayed.push({
      user: { connect: { id: data.loserId } },
      score: data.scorePlayer2,
      isWinner: false,
      isAi: false,
    });
  } else if (data.loserId === -1) {
    gamePlayed.push({
      score: data.scorePlayer2,
      isWinner: false,
      isAi: true,
    });
  }

  return {
    gameId: data.gameId,
    status: data.status,
    startedAt: new Date(data.startedAt).toISOString(),
    finishedAt: new Date(data.finishedAt).toISOString(),
    gamePlayed: { create: gamePlayed },
  };
}

export async function getAllorFiltered(
  filters?: Partial<result>,
): Promise<resultResponseArrayType> {
  let ret;

  if (!filters) {
    ret = await resultModel.findAll(options);
  } else {
    ret = await resultModel.findBy(filters, options);
  }
  if (!ret || ret.length === 0) {
    throw new NotFoundError('No result found');
  }
  return ret;
}

export async function getById(id: number): Promise<resultResponseType> {
  const ret = await resultModel.findById(id, options);
  if (!ret) throw new NotFoundError(`result with ${id} not found`);

  return ret;
}

export async function create(
  data: resultCreateInput,
): Promise<resultResponseType> {
  const prismaData = await transformData(data);
  let ret;

  try {
    ret = await resultModel.insert(prismaData);

    if (!ret) {
      throw new NotFoundError(`result not found`);
    }

    ret = await resultModel.findById(ret.id, options);

    if (!ret) {
      throw new NotFoundError(`result not found`);
    }

    return ret;
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictError(`result already exists`);
    }
    throw err;
  }
}
