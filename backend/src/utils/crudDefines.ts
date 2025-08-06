import { RouteGenericInterface } from 'fastify';

export interface CrudRoutesOptions<
  TEntity = unknown,
  TQuery = unknown,
  TCreate = unknown,
  TUpdate = unknown,
  TId = unknown,
> {
  basePath: string;
  entityName: string;
  controller: {
    getAllorFiltered?: (query: TQuery) => Promise<TEntity[]>;
    getById?: (id: TId) => Promise<TEntity>;
    create?: (body: TCreate) => Promise<TEntity>;
    update?: (id: TId, body: TUpdate) => Promise<TEntity>;
    deleteOne?: (id: TId) => Promise<{ success: boolean }>;
  };
  routes?: Array<'getAll' | 'getById' | 'create' | 'update' | 'delete'>;
}

export interface GetAll<TQuery> extends RouteGenericInterface {
  Querystring: TQuery;
}

export interface GetById<TId> extends RouteGenericInterface {
  Params: TId;
}

export interface Create<TCreate> extends RouteGenericInterface {
  Body: TCreate;
}

export interface Update<TId, TUpdate> extends RouteGenericInterface {
  Params: TId;
  Body: TUpdate;
}

export interface Delete<TId> extends RouteGenericInterface {
  Params: TId;
}
