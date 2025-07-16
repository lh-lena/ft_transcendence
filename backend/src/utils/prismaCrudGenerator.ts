import { Context } from '../context';
import { prisma } from '../plugins/001_prisma';

export function createCrud<ModelName extends keyof PrismaClient>( modelName: ModelName ) {

  const model = prisma[modelName];

	return {
    findAll: async() => {
      return model.findMany()
    },

    findById: async ( id: number | string ) => {
     return model.findUnique({ where: { id } })
    },

    findBy: async ( filters: Record<string, any> ) => {
     return model.findMany({ where: filters })
    },

    insert: async ( data: Record<string, any> ) => {
     return model.create({ data })
    },

    patch: async ( id: number | string, data: Record<string, any> ) => {
       return model.update({ 
        where: { id },
        data,
      })
    },

    remove: async ( id: number | string ) => {
      const del = model.delete({ where: { id } })
      console.log( "DEL:", del );
      return del;
    },

  };
}
