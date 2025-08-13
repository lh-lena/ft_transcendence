import { userModel } from './user.crud';
import { NotFoundError, ConflictError } from '../../utils/error';
import { Prisma, user } from '@prisma/client';

import { transformQuery } from '../../utils/crudQueryBuilder';

export const userService = {
  async create(data: Prisma.userCreateInput): Promise<user> {
    try {
      const ret = await userModel.insert(data);
      return ret;
    } catch (err: unknown) {
      if (err.code === 'P2002') {
        throw new ConflictError(`user already exists`);
      }
      throw err;
    }
  },

  async update(id: number, data: Prisma.userUpdateInput): Promise<user> {
    try {
      return await userModel.patch(id, data);
    } catch (err: unknown) {
      if (err.code === 'P2002') {
        throw new ConflictError(`user already exists`);
      }
      if (err.code === 'P2025') {
        throw new NotFoundError(`user with ${id} not found`);
      }
      throw err;
    }
  },

  async getQuery(query?: Prisma.userWhereInput): Promise<user[]> {
    const ret = query
      ? await userModel.findBy(transformQuery(query))
      : await userModel.findAll();

    if (ret.length === 0) {
      throw new NotFoundError('No user found');
    }
    return ret;
  },

  async getById(id: number): Promise<user> {
    const ret = await userModel.findById(id);

    if (!ret) throw new NotFoundError(`user with ${id} not found`);

    return ret;
  },

  async deleteOne(id: number): Promise<void> {
      const ret = await userModel.deleteOne(id);
      if (!ret) throw new NotFoundError(`user with ${id} not found`);
    }
  }
};
