import { prisma } from '../plugins/001_prisma';

export function createCrud<ModelName extends keyof PrismaClient>(modelName: ModelName) {
  const model = prisma[modelName];

  return {
    findAll: async () => {
      return await model.findMany();
    },

    findById: async (id: number | string) => {
      return await model.findUnique({ where: { id } });
    },

    findBy: async (filters: Record<string, any>) => {
      return await model.findMany({ where: filters });
    },

    insert: async (data: Record<string, any>) => {
      return await model.create({ data });
    },

    patch: async (id: number | string, data: Record<string, any>) => {
      return await model.update({
        where: { id },
        data,
      });
    },

    remove: async (id: number | string) => {
      return await model.delete({ where: { id } });
    },
  };
}
