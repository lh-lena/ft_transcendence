import { userModel } from './user.crud';
import { NotFoundError, ConflictError } from '../../utils/error';
import { Prisma, User } from '@prisma/client';
import { userInfoType } from '../../schemas/user';

export const userService = {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      const ret = await userModel.insert(data);
      return ret;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(`user already exists`);
      }
      throw err;
    }
  },

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await userModel.patch(id, data);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictError(`user already exists`);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundError(`user with ${id} not found`);
      }
      throw err;
    }
  },

  async getQuery(query?: Prisma.UserWhereInput): Promise<User[]> {
    const ret = query ? await userModel.findBy(query) : await userModel.findAll();

    if (ret.length === 0) {
      throw new NotFoundError('No user found');
    }
    return ret;
  },

  async getById(id: string): Promise<User> {
    const ret = await userModel.findById(id);

    if (!ret) throw new NotFoundError(`user with ${id} not found`);

    return ret;
  },

  async getInfoById(id: string): Promise<userInfoType> {
    const user: userInfoType = await this.getById(id);
    return user;
  },

  async deleteOne(id: string): Promise<void> {
    const ret = await userModel.deleteOne(id);
    if (!ret) throw new NotFoundError(`user with ${id} not found`);
  },

  async getCount(): Promise<number> {
    const ret = await userModel.findAll();
    return ret.length;
  },
};
