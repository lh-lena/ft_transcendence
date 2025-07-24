import { prisma } from '../plugins/001_prisma';
import { buildQuery } from './queryBuilder';

export function createCrud<ModelName extends keyof PrismaClient>( modelName: ModelName ) {

  const model = prisma[modelName];

	return {
    findAll: async(
      options: Record<string, any> = {}
    ) => {
      console.log( modelName );
      return await model.findMany( options )
    },

    findById: async (
      id: number | string,
      options: Record<string, any> = {}
    ) => {
     return await model.findUnique({ where: { id }, ...options })
    },

    findBy: async (
      filters: Record<string, any>,
      options: Record<string, any> = {}
    ) => {
      const query = await buildQuery( filters as Record<string, string | string[]> ); 
      return await model.findMany({ where: query, ...options })
    },

    insert: async ( data: Record<string, any>, options: Record<string, any> = {}  ) => {
     return await model.create({ data, ...options })
    },

    patch: async (
      id: number | string,
      data: Record<string, any>,
      options: Record<string, any> = {}
    ) => {
       return await model.update({ 
        where: { id },
        data,
        ...options,
      })
    },

    remove: async (
      id: number | string,
      options: Record<string, any> = {}
    ) => {
      return await model.delete({ where: { id }, ...options })
    },

  };
}
