import { RouteGenericInterface } from 'fastify';

export interface CrudRoutesOptions<
  TEntity = unknown,
  TQuery = unknown,
  TCreate = unknown,
  TUpdate = unknown,
> {
  basePath: string;
  entityName: string;
  controller: {
    getAllorFiltered?: (query: TQuery) => Promise<TEntity[]>;
    getById?: (id: number | string) => Promise<TEntity>;
    create?: (body: TCreate) => Promise<TEntity>;
    update?: (id: number | string, body: TUpdate) => Promise<TEntity>;
    deleteOne?: (id: number | string) => Promise<{ success: boolean }>;
  };
  routes?: Array<'getAll' | 'getById' | 'create' | 'update' | 'delete'>;
}

export interface GetAll<TQuery> extends RouteGenericInterface {
  Querystring: TQuery;
}

export interface GetById extends RouteGenericInterface {
  Params: { id: number | string };
}

export interface Create<TCreate> extends RouteGenericInterface {
  Body: TCreate;
}

export interface Update<TUpdate> extends RouteGenericInterface {
  Params: { id: number | string };
  Body: TUpdate;
}

export interface Delete extends RouteGenericInterface {
  Params: { id: number | string };
}
