import { z } from 'zod/v4';
import { dtString, tfaType } from './basics';

export const userSchema = z.object({
  userId: z.uuid(),
  githubId: z.string().nullable().optional(),

  createdAt: dtString.optional(),
  updatedAt: dtString.optional(),

  username: z.string().nullable(),
  alias: z.string().nullable().optional(),

  online: z.boolean().optional(),

  password_hash: z.string().nullable(),

  tfaEnabled: z.boolean().default(false),
  tfaSecret: z.string().nullable().default(null),
  tfaMethod: tfaType.nullable().default(null),
  tfaTempCode: z.string().nullable().default(null),
  tfaCodeExpires: dtString.nullable().default(null),
  backupCodes: z.string().nullable().default(null),

  guest: z.boolean().default(false),

  color: z.string(),
  colormap: z.string(),
  avatar: z.string().nullable().optional(),
});

export const guestSchema = userSchema.pick({
  userId: true,
  alias: true,
  guest: true,
  color: true,
  colormap: true,
});

export const userIdSchema = userSchema.pick({
  userId: true,
});

export const userQuerySchema = userSchema
  .pick({
    userId: true,

    createdAt: true,
    updatedAt: true,

    username: true,
    alias: true,
  })
  .partial();

export const userRegisterSchema = userSchema
  .pick({
    username: true,
    alias: true,
    guest: true,
    color: true,
    colormap: true,
  })
  .extend({
    password: z.string().min(8).max(32),
    username: z.string().min(1).max(6),
  });

export const userPostSchema = userSchema.pick({
  username: true,
  alias: true,
  password_hash: true,
  guest: true,
  color: true,
  colormap: true,
  tfaEnabled: true,
});

export const userLoginSchema = userSchema
  .pick({
    username: true,
  })
  .extend({ password: z.string().min(8) });

export const userPatchSchema = z.object({
  username: z.string().min(1).max(6).optional(),
  alias: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
  avatar: z.string().nullable().optional(),
});

export const userUpdateSchema = userSchema.partial();

export const userResponseSchema = userSchema.omit({
  password_hash: true,
  githubId: true,
  tfaSecret: true,
  tfaMethod: true,
  tfaTempCode: true,
  tfaCodeExpires: true,
  backupCodes: true,
});

export const userInfoResponseSchema = userResponseSchema.omit({
  createdAt: true,
  updatedAt: true,
  guest: true,
});
export const userInfoResponseArraySchema = z.array(userInfoResponseSchema);

export const guestPostSchema = z.object({
  alias: z.string(),
  color: z.string(),
  colormap: z.string(),
  guest: z.boolean().default(true),
});

//typed
export type UserType = z.infer<typeof userSchema>;
export type UserRegisterType = z.infer<typeof userRegisterSchema>;
export type UserLoginType = z.infer<typeof userLoginSchema>;
export type UserIdType = z.infer<typeof userIdSchema>;
export type UserQueryType = z.infer<typeof userQuerySchema>;
export type UserPatchType = z.infer<typeof userPatchSchema>;
export type UserUpdateType = z.infer<typeof userUpdateSchema>;
export type GuestPostType = z.infer<typeof guestPostSchema>;
export type GuestType = z.infer<typeof guestSchema>;
