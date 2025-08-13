import { Prisma, user } from '@prisma/client';
import * as userService from './user.service';

export const userController = {
  //controller to create an user
  async create(data: Prisma.userCreateInput): Promise<user> {
    const ret = await userService.create(data);
    return ret;
  },

  //update user
  async update(id: number, data: Prisma.userUpdateInput): Promise<user> {
    const ret = await userService.update(id, data);
    return ret;
  },

  //controller for user get All or by Id
  async getAllorFiltered(query?: Prisma.userWhereInput): Promise<user[]> {
    const ret = await userService.getQuery(query);
    return ret;
  },

  async getById(id: number): Promise<user> {
    const ret = await userService.getById(id);
    return ret;
  },

  //delete user
  async deleteOne(id: userIdInput): Promise<void> {
    return userService.deleteOne(id);
  },
};
