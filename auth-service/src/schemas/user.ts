import { z } from 'zod/v4';
import { dtString } from './basics';

export const userSchema = z.object({
  userId: z.uuid(),

  createdAt: dtString,
  updatedAt: dtString,

  email: z.email(),
  username: z.string().min(3).max(15),
  alias: z.string().optional(),

  password_hash: z.string(),

  is_2fa_enabled: z.boolean().optional(),
  twofa_secret: z.string().nullable().optional(),
  twofa_method: z.string().optional(),
  twofa_temp_code: z.string().optional(),
  twofa_code_expires: dtString.optional(),

  guest: z.boolean().default(false),

  color: z.string(),
  colormap: z.string(),
  avatar: z.url().optional().nullable(),
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

export const userResponseSchema = userSchema.omit({
  password_hash: true,
  is_2fa_enabled: true,
  twofa_secret: true,
  twofa_method: true,
  twofa_temp_code: true,
  twofa_code_expires: true,
});
