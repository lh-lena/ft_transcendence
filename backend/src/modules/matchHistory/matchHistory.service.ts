import { createCrud } from '../../utils/prismaCrudGenerator';
import { AppError, NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';

const MatchHistoryModel = createCrud('matchHistory');

export async function getAllorFilteredMatchHistory(
  filters: Record<string, any>
) {

  let MatchHistory;

  if (Object.keys(filters).length === 0) {
    MatchHistoryes = await MatchHistoryModel.findAll();
  } else {
    MatchHistoryes = await MatchHistoryModel.findBy(filters);
  }

  if (!MatchHistoryes || MatchHistoryes.length === 0) {
    throw new NotFoundError('No MatchHistoryes found');
  }

  return MatchHistoryes;
}

export async function getMatchHistoryById(id: number) {
  const MatchHistory = await MatchHistoryModel.findById(id);
  if (!MatchHistory) {
    throw new NotFoundError(`MatchHistory with id ${id} not found`);
  }
  return MatchHistory;
}

export async function createMatchHistory(data: any) {
  try {
    const MatchHistory = await MatchHistoryModel.insert(data);
    return MatchHistory;
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('MatchHistory already exists');
    }
    throw err;
  }
}

export async function updateMatchHistory(id: number, data: any) {
  try {
    const MatchHistory = await MatchHistoryModel.patch(id, data);
    if (!MatchHistory) {
      throw new NotFoundError(`MatchHistory with id ${id} not found`);
    }
    return MatchHistory;
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('MatchHistory already exists');
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new NotFoundError(`MatchHistory with id ${id} not found`);
    }
    throw err;
  }
}

export async function removeMatchHistory(id: number) {
  try {
    const MatchHistory = await MatchHistoryModel.remove(id);
    if (!MatchHistory)
      throw new NotFoundError(`MatchHistory with id ${id} not found`);
    return { message: `MatchHistory ${id} deleted successfully` };
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new NotFoundError(`MatchHistory with id ${id} not found`);
    }
    throw err;
  }
}
