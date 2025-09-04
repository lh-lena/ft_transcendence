import { Prisma } from '@prisma/client';
import { blockedCreateType } from '../../schemas/blocked';

export async function transformInput(data: blockedCreateType): Promise<Prisma.BlockedCreateInput> {
  return {
    user: { connect: { id: data.userId } },
    blocked: { connect: { id: data.blockedId } },
  };
}
