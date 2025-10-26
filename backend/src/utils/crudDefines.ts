import { RouteGenericInterface } from 'fastify';

export interface CrudRoutesOptions {
  basePath: string;
  entityName: string;
  routes?: Array<'getQuery' | 'getById' | 'create' | 'update' | 'delete'>;
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

export interface Join<TEntity> extends RouteGenericInterface {
  Body: TEntity;
}
