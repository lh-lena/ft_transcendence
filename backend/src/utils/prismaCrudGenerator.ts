import { prisma } from '../plugins/001_prisma';
import { buildQuery } from './queryBuilder';

const modelMap = {
  user: prisma.user,
  result: prisma.result,
};

type ModelName = keyof typeof modelMap;

type ModelDelegate<M extends ModelName> = (typeof modelMap)[M];

type ModelType<M extends ModelName> = Awaited<
  ReturnType<ModelDelegate<M>['findUnique']>
>;

export function createCrud<M extends ModelName>(modelName: M) {
  const model = modelMap[modelName];

  return {
    findAll: async (
      options?: Parameters<ModelDelegate<M>['findMany']>[0],
    ): Promise<ModelType<M>[]> => {
      const ret = await model.findMany(options);
      return ret;
    },

    findById: async (
      id: number | string,
      options?: Omit<Parameters<ModelDelegate<M>['findUnique']>[0], 'where'>,
    ): Promise<ModelType<M> | null> => {
      const ret = await model.findUnique({ where: { id }, ...options });
      return ret;
    },

    findBy: async (
      filters: Omit<Parameters<ModelDelegate<M>['findMany']>[0], 'where'>,
      options?: Omit<Parameters<ModelDelegate<M>['findMany']>[0], 'where'>,
    ): Promise<ModelType<M>[]> => {
      const query = buildQuery(filters);
      const ret = await model.findMany({ where: query, ...options });
      return ret;
    },

    insert: async (
      data: Parameters<ModelDelegate<M>['create']>[0]['data'],
      options?: Omit<Parameters<ModelDelegate<M>['create']>[0], 'data'>,
    ): Promise<ModelType<M>> => {
      const ret = await model.create({ data, ...options });
      return ret;
    },

    patch: async (
      id: number | string,
      data: Parameters<ModelDelegate<M>['update']>[0]['data'],
      options?: Omit<
        Parameters<ModelDelegate<M>['update']>[0],
        'data' | 'where'
      >,
    ): Promise<ModelType<M>> => {
      const ret = await model.update({
        where: { id },
        data,
        ...options,
      });
      return ret;
    },

    deleteOne: async (
      id: number | string,
      options?: Omit<Parameters<ModelDelegate<M>['delete']>[0], 'where'>,
    ): Promise<ModelType<M>> => {
      const ret = await model.delete({ where: { id }, ...options });
      return ret;
    },
  };
}
