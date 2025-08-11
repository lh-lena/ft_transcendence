import type {
  userCreateInput,
  userUpdateInput,
  userQueryInput,
  userIdInput,
  userResponseType,
  userResponseArrayType,
} from '../../schemas/user';

import * as userService from './user.service';

export const userController = {
  //controller to create an user
  async create(input: userCreateInput): Promise<userResponseType> {
    const ret = await userService.create(input);
    return ret;
  },

  //update user
  async update(
    id: userIdInput,
    input: userUpdateInput,
  ): Promise<userResponseType> {
    const ret = await userService.update(id, input);
    return ret;
  },

  //controller for user get All or by Id
  async getAllorFiltered(
    query: userQueryInput,
  ): Promise<userResponseArrayType> {
    const ret = await userService.getQuery(query);
    return ret;
  },

  async getById(id: userIdInput): Promise<userResponseType> {
    const ret = await userService.getById(id);
    return ret;
  },

  //delete user
  async deleteOne(id: userIdInput): Promise<{ success: true }> {
    const ret = userService.deleteOne(id);
    return ret;
  },
};
