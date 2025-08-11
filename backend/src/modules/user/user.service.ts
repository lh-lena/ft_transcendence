import { userCrud as userModel } from './user.crud';
import { NotFoundError, ConflictError } from '../../utils/error';
import { Prisma } from '@prisma/client';

const options = { include: { gamePlayed: true } };

import {
  userIdInput,
  userQueryInput,
  userCreateInput,
  userUpdateInput,
  userResponseType,
  userResponseArrayType,
} from '../../schemas/user';

export async function getQuery(
  filters?: userQueryInput,
): Promise<userResponseArrayType> {
  let ret;

  if (!filters) {
    ret = await userModel.findAll(options);
  } else {
    ret = await userModel.findBy(filters, options);
  }
  if (!ret || ret.length === 0) {
    throw new NotFoundError('No user found');
  }
  return ret;
}

export async function getById(id: userIdInput): Promise<userResponseType> {
  const ret = await userModel.findById(id.id);

  if (!ret) throw new NotFoundError(`user with ${id} not found`);

  return ret;
}

export async function create(data: userCreateInput): Promise<userResponseType> {
  try {
    const ret = await userModel.insert(data);
    return ret;
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictError(`user already exists`);
    }
    throw err;
  }
}

export async function update(
  id: userIdInput,
  data: userUpdateInput,
): Promise<userResponseType> {
  try {
    const ret = await userModel.patch(id.id, data);
    if (!ret) throw new NotFoundError(`user with ${id} not found`);
    return ret;
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      throw new ConflictError(`user already exists`);
    }
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new NotFoundError(`user with ${id} not found`);
    }
    throw err;
  }
}

export async function deleteOne(
  id: userIdInput,
): Promise<{ success: boolean }> {
  try {
    const ret = await userModel.deleteOne(id.id);
    if (!ret) throw new NotFoundError(`user with ${id} not found`);
    return { success: true };
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new NotFoundError(`user with ${id} not found`);
    }
    throw err;
  }
}
