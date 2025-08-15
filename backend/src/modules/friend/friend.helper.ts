import { Prisma } from '@prisma/client';
import { friendCreateType } from '../../schemas/friend';

export async function transformInput(
  data: friendCreateType,
): Promise<Prisma.friendCreateInput> {
  return {
    user: { connect: { id: data.userId } },
    friend: { connect: { id: data.friendId } },
  };
}
