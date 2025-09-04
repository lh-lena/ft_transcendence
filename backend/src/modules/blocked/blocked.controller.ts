import { Prisma } from '@prisma/client';
import type { blockedType, blockedCreateType } from '../../schemas/blocked';

import { blockedService } from './blocked.service';

export const blockedController = {
  async create(data: blockedCreateType): Promise<blockedType> {
    const ret = await blockedService.create(data);
    return ret;
  },

  async getQuery(query?: Prisma.BlockedWhereInput): Promise<blockedType[]> {
    const ret = await blockedService.getQuery(query);
    return ret;
  },

  async deleteOne(id: number): Promise<{ success: boolean }> {
    await blockedService.deleteOne(id);
    return { success: true };
  },
};
