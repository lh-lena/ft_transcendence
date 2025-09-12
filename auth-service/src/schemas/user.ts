import { z } from 'zod/v4';
import { dtString, tfaType } from './basics';

export const userSchema = z.object({
  userId: z.uuid(),

  createdAt: dtString.optional(),
  updatedAt: dtString.optional(),

  email: z.email(),
  username: z.string().min(3).max(15),
  alias: z.string().optional(),

  password_hash: z.string(),

  tfaEnabled: z.boolean().default(false),
  tfaSecret: z.string().nullable().default(null),
  tfaMethod: tfaType.nullable().default(null),
  tfaTempCode: z.string().nullable().default(null),
  tfaCodeExpires: dtString.nullable().default(null),
  backupCodes: z.array(z.string()).nullable().default(null),

  guest: z.boolean().default(false),

  color: z.string(),
  colormap: z.string(),
  avatar: z.url().nullable().optional(),
});

export const userIdSchema = userSchema.pick({
  userId: true,
});

export const userQuerySchema = userSchema.pick({
  userId: true,

  createdAt: true,
  updatedAt: true,

  email: true,
  username: true,
  alias: true,
});

export const userRegisterSchema = userSchema
  .pick({
    email: true,
    username: true,
    alias: true,
    guest: true,
    color: true,
    colormap: true,
  })
  .extend({
    password: z.string().min(8),
  });

export const userLoginSchema = userSchema
  .pick({ email: true })
  .extend({ password: z.string().min(8) });

export const userPatchSchema = userSchema.pick({
  email: true,
  username: true,
  alias: true,
});

export const userResponseSchema = userSchema.omit({
  password_hash: true,
  is_2fa_enabled: true,
  twofa_secret: true,
  twofa_method: true,
  twofa_temp_code: true,
  twofa_code_expires: true,
});

export const userInfoResponseSchema = userResponseSchema.omit({
  createdAt: true,
  updatedAt: true,
  email: true,
  guest: true,
});
export const userInfoResponseArraySchema = z.array(userInfoResponseSchema);

//typed
export type UserType = z.infer<typeof userSchema>;
export type UserIdType = z.infer<typeof userIdSchema>;
export type UserQueryType = z.infer<typeof userQuerySchema>;
export type UserPatchType = z.infer<typeof userPatchSchema>;
