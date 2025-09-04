import { Prisma } from '@prisma/client';
import type { userType } from '../../schemas/user';

import { userService } from './user.service';
import { transformUser } from './user.helper';

export const userController = {
  //controller to create an user
  async create(data: Prisma.UserCreateInput): Promise<userType> {
    const ret = await userService.create(data);
    return await transformUser(ret);
  },

  //update user
  async update(id: string, data: Prisma.UserUpdateInput): Promise<userType> {
    console.log(data);
    const ret = await userService.update(id, data);
    return await transformUser(ret);
  },

  //controller for user get All or by Id
  async getQuery(query?: Prisma.UserWhereInput): Promise<userType[]> {
    const ret = await userService.getQuery(query);
    return Promise.all(ret.map((user) => transformUser(user)));
  },

  async getById(id: string): Promise<userType> {
    const ret = await userService.getById(id);
    return await transformUser(ret);
  },

  //delete user
  async deleteOne(id: string): Promise<{ success: boolean }> {
    await userService.deleteOne(id);
    return { success: true };
  },

  //uniqe
  async getCount(): Promise<{ count: number }> {
    const ret = await userService.getCount();

    return { count: ret };
  },
};
