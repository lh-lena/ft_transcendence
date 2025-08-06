import { PrismaClient, Prisma } from '@prisma/client';

type ModelDelegate<TClient, TModel extends keyof TClient> = TClient[TModel];

export function createCrud<
  TClient extends PrismaClient,
  TModel extends keyof TClient & string
>(
  prisma: TClient,
  model: TModel
) {
  const delegate = prisma[model] as ModelDelegate<TClient, TModel>;

  return {
    findAll: (args?: Parameters<typeof delegate['findMany']>[0]) =>
      delegate.findMany(args),

    findById: (id: unknown) =>
      delegate.findUnique({ where: { id } } as any),

    create: (data: Parameters<typeof delegate['create']>[0]['data']) =>
      delegate.create({ data }),

    update: (id: unknown, data: Parameters<typeof delegate['update']>[0]['data']) =>
      delegate.update({ where: { id }, data } as any),

    delete: (id: unknown) =>
      delegate.delete({ where: { id } } as any)
  };
}
