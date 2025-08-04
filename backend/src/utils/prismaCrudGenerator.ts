import { prisma } from '../plugins/001_prisma';
import { buildQuery } from './queryBuilder';

export function createCrud<
  ModelName extends keyof PrismaClient,
  ModelDelegate extends PrismaClient[ModelName] = PrismaClient[ModelName],
  ModelType = ModelName extends keyof PrismaClient
    ? ReturnType<PrismaClient[ModelName]['findUnique']> extends Promise<infer R>
      ? R
      : never
    : never,
>(modelName: ModelName) {
  const model = prisma[modelName] as ModelDelegate;

  return {
    findAll: async (
      options?: Parameters<ModelDelegate['findMany']>[0],
    ): Promise<ModelType[]> => {
      return await model.findMany(options);
    },

    findById: async (
      id: number | string,
      options?: Omit<Parameters<ModelDelegate['findUniqe']>[0], 'where'>,
    ): Promise<ModelType | null> => {
      return await model.findUnique({ where: { id }, ...options });
    },

    findBy: async (
      filters: Record<string, string | string[]>,
      options?: Omit<Parameters<ModelDelegate['findMany']>[0], 'where'>,
    ): Promise<ModelType[]> => {
      const query = await buildQuery(filters);
      return await model.findMany({ where: query, ...options });
    },

    insert: async (
      data: Parameters<ModelDelegate['create']>[0]['data'],
      options?: Omit<Parameters<ModelDelegate['create']>[0], 'data'>,
    ): Promise<ModelType> => {
      return await model.create({ data, ...options });
    },

    patch: async (
      id: number | string,
      data: Parameters<ModelDelegate['update']>[0]['data'],
      options?: Omit<Parameters<ModelDelegate['update']>[0], 'data' | 'where'>,
    ): Promise<ModelType> => {
      return await model.update({
        where: { id },
        data,
        ...options,
      });
    },

    deleteOne: async (
      id: number | string,
      options?: Omit<Parameters<ModelDelegate['delete']>[0], 'where'>,
    ): Promise<ModelType> => {
      return await model.delete({ where: { id }, ...options });
    },
  };
}
