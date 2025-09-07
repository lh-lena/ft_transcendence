import { tfaHandler } from './tfa';
import { hashPassword } from '../utils/password';
import { apiClientBackend } from '../utils/apiClient';

import { userSchema } from '../schemas/user';
import type { UserType, UserRegisterType } from '../schemas/user';

export const tfa = new tfaHandler();

export const auth = {
  async register(user: UserRegisterType): Promise<UserType> {
    const password_hash = await hashPassword(user.password);
    const newUser: UserType = userSchema.parse({ ...user, password_hash });

    const ret: UserType = await apiClientBackend.post('/user', newUser);

    return ret;
  },
};
