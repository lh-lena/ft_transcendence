import { Prisma, Friendship } from '@prisma/client';
import { friendModel } from './friend.crud';
import type { friendCreateType, friendIdType } from '../../schemas/friend';

import { NotFoundError } from '../../utils/error';

import { transformInput } from './friend.helper';

export const friendService = {
  async create(data: friendCreateType): Promise<Friendship> {
    const prismaData = await transformInput(data);
    try {
      const ret = await friendModel.insert(prismaData);
      return ret;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new NotFoundError('friend already exists');
      }
      throw err;
    }
  },

  async getQuery(query?: Prisma.FriendshipWhereInput): Promise<Friendship[]> {
    const ret = query ? await friendModel.findBy(query) : await friendModel.findAll();

    return ret;
  },

  async deleteOne(id: friendIdType): Promise<void> {
    const ret = await friendModel.deleteOne(id);
    if (!ret) {
      throw new NotFoundError('friend not found');
    }
  },
};
