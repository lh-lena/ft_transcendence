import { FastifyInstance } from 'fastify';
import * as User from '../schemas/user';
import { AxiosRequestConfig } from 'axios';

export const userActions = (server: FastifyInstance) => ({
  async post(newUser: User.UserType) {
    const config: AxiosRequestConfig = {
      method: 'post',
      url: '/user',
      data: newUser,
    };

    //TODO add logging ->

    const user: User.UserType = await server.api(config);

    return user;
  },

  async getById(userId: string) {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/user/${userId}`,
    };

    const user: User.UserType = await server.api(config);

    return user;
  },

  async getUser(params: object) {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/user`,
      params: params,
    };

    const user: User.UserType[] = await server.api(config);

    return user[0];
  },

  async getUsersArr(params: object) {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: `/user`,
      params: params,
    };

    const user: User.UserType[] = await server.api(config);

    return user;
  },
});
