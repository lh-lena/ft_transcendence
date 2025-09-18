import { Prisma } from '@prisma/client';
import { blockedCreateType } from '../../schemas/blocked';

export async function transformInput(data: blockedCreateType): Promise<Prisma.BlockedCreateInput> {
  return {
    user: { connect: { userId: data.userId } },
    blocked: { connect: { userId: data.blockedId } },
  };
}
