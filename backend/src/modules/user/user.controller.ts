import { Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
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
  async update(id: number, data: Prisma.UserUpdateInput): Promise<userType> {
    const ret = await userService.update(id, data);
    return await transformUser(ret);
  },

  //controller for user get All or by Id
  async getQuery(query?: Prisma.UserWhereInput): Promise<userType[]> {
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

  //uniqe
  async getCount(): Promise<{ count: number }> {
    const ret = await userService.getCount();

    return { count: ret };
  },

  async uploadAvatar(request: FastifyRequest, reply: FastifyReply) {
    const parts = request.parts();
    let file;
    for await (const part of parts) {
      if (part.file && part.fieldname === 'avatar') {
        file = part;
        break;
      }
    }
    if (!file) return reply.status(400).send({ error: 'No file uploaded.' });

    try {
      const avatarUrl = await userService.saveAvatar(userId, file);
      return reply.send({ avatarUrl });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  },
};
