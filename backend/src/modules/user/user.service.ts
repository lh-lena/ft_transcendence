import { userModel } from './user.crud';
import path from 'path';
import fs from 'fs/promises';
import { NotFoundError, ConflictError } from '../../utils/error';
import { Prisma, User } from '@prisma/client';

import { userInfoType } from '../../schemas/user';

const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

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

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
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

  async getById(id: number): Promise<User> {
    const ret = await userModel.findById(id);

    if (!ret) throw new NotFoundError(`user with ${id} not found`);

    return ret;
  },

  async getInfoById(id: number): Promise<userInfoType> {
    const user = await this.getById(id);
    return user as userInfoType;
  },

  async deleteOne(id: number): Promise<void> {
    const ret = await userModel.deleteOne(id);
    if (!ret) throw new NotFoundError(`user with ${id} not found`);
  },

  async getCount(): Promise<number> {
    const ret = await userModel.findAll();
    return ret.length;
  },

  async saveAvatar(userId: number, file: unknown): Promise<string> {
    const ext = path.extname(file.filename).toLowerCase();
    if (!allowedExts.includes(ext)) throw new Error('Invalid file type.');

    const uploadDir = path.join(process.cwd(), 'public', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `avatar_${userId}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const writeStream = await fs.open(filePath, 'w');
    for await (const chunk of file.file) {
      await writeStream.write(chunk);
    }
    await writeStream.close();

    const avatarUrl = `/avatars/${filename}`;
    await this.update(userId, { avatarUrl: avatarUrl });

    return avatarUrl;
  },
};
