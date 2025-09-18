import { Prisma } from '@prisma/client';
import { friendCreateType } from '../../schemas/friend';

export async function transformInput(
  data: friendCreateType,
): Promise<Prisma.FriendshipCreateInput> {
  return {
    user: { connect: { userId: data.userId } },
    friend: { connect: { userId: data.friendId } },
  };
}
