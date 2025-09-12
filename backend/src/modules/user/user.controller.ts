import { Prisma } from '@prisma/client';
import type { userType } from '../../schemas/user';

import { userService } from './user.service';
import { userBase, userBaseArray } from '../../schemas/user';

export const userController = {
  //controller to create an user
  async create(data: Prisma.UserCreateInput): Promise<userType> {
    const ret = await userService.create(data);
    const user = userBase.safeParse(ret);

    if (!user.success) throw new Error('User creation failed');

    return user.data;
  },

  //update user
  async update(id: string, data: Prisma.UserUpdateInput): Promise<userType> {
    console.log(data);
    const ret = await userService.update(id, data);
    const user = userBase.safeParse(ret);

    if (!user.success) throw new Error('User creation failed');

    return user.data;
  },

  //controller for user get All or by Id
  async getQuery(query?: Prisma.UserWhereInput): Promise<userType[]> {
    const ret = await userService.getQuery(query);

    const user = userBaseArray.safeParse(ret);

    if (!user.success) throw new Error('User creation failed');

    return user.data;
  },

  async getById(id: string): Promise<userType> {
    const ret = await userService.getById(id);
    const user = userBase.safeParse(ret);

    if (!user.success) throw new Error('User creation failed');

    return user.data;
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
