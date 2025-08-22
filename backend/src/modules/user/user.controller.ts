import { Prisma } from '@prisma/client';
import type { userType } from '../../schemas/user';

import { userService } from './user.service';
import { transformUser } from './user.helper';

export const userController = {
  //controller to create an user
  async create(data: Prisma.userCreateInput): Promise<userType> {
    const ret = await userService.create(data);
    return await transformUser(ret);
  },

  //update user
  async update(id: number, data: Prisma.userUpdateInput): Promise<userType> {
    const ret = await userService.update(id, data);
    return await transformUser(ret);
  },

  //controller for user get All or by Id
  async getQuery(query?: Prisma.userWhereInput): Promise<userType[]> {
    const ret = await userService.getQuery(query);
    return Promise.all(ret.map((user) => transformUser(user)));
  },

  async getById(id: number): Promise<userType> {
    const ret = await userService.getById(id);
    return await transformUser(ret);
  },

  //delete user
  async deleteOne(id: number): Promise<{ success: boolean }> {
    await userService.deleteOne(id);
    return { success: true };
  },
};
