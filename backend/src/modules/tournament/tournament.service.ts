import { createCrud } from '../../utils/prismaCrudGenerator';
import { NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';
import { tournament } from '../../schemas/tournament';

const tournamentModel = createCrud('tournament');

export async function getQuery(filters?: Partial<tournament>) {
  let ret;

  if (Object.keys(filters).length === 0) {
    ret = await tournamentModel.findAll();
  } else {
    ret = await tournamentModel.findBy(filters);
  }
  if (!ret || ret.length === 0) {
    throw new NotFoundError('No tournament found');
  }
  return ret;
}

export async function getById(id: number) {
  const ret = await tournamentModel.findById(id);
  if (!ret || ret.length === 0)
    throw new NotFoundError(`tournament with ${id} not found`);

  return ret;
}

export async function create(data: createtournamentInput) {
  try {
    const ret = await tournamentModel.insert(data);
    return ret;
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictError(`tournament already exists`);
    }
    throw err;
  }
}

export async function update(id: number, data: patchtournamentInput) {
  try {
    const ret = await tournamentModel.patch(id, data);
    if (!ret) throw new NotFoundError(`tournament with ${id} not found`);
    return ret;
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictError(`tournament already exists`);
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new NotFoundError(`tournament with ${id} not found`);
    }
    throw err;
  }
}

export async function deleteOne(id: number) {
  try {
    const ret = await tournamentModel.deleteOne(id);
    if (!ret) throw new NotFoundError(`tournament with ${id} not found`);
    return { message: `tournament ${id} deleted successfulyy` };
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new NotFoundError(`tournament with ${id} not found`);
    }
    throw err;
  }
}
