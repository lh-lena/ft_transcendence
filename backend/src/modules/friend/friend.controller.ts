import { Prisma } from '@prisma/client';
import type { friendType, friendCreateType } from '../../schemas/friend';

import { friendService } from './friend.service';

export const friendController = {
  async create(data: friendCreateType): Promise<friendType> {
    const ret = await friendService.create(data);
    return ret;
  },

  async getQuery(query?: Prisma.FriendshipWhereInput): Promise<friendType[]> {
    const ret = await friendService.getQuery(query);
    return ret;
  },

  async deleteOne(id: number): Promise<{ success: boolean }> {
    await friendService.deleteOne(id);
    return { success: true };
  },
};
