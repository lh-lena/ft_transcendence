import { user } from '@prisma/client';
import type { userType } from '../../schemas/user';

export async function transformUser(user: user): Promise<userType> {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
