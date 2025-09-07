import { z } from 'zod/v4';
import { dtString, tfaType } from './basics';

export const tfaSession = z.object({
  sessionId: z.uuid(),
  userId: z.uuid(),
  type: tfaType.nullable(),
  create: dtString.default(() => new Date().toISOString()),
});

export const tfaVerifySchema = tfaSession
  .pick({
    sessionId: true,
    userId: true,
    type: true,
  })
  .extend({ code: z.string() });

export const tfaSetupSchema = tfaSession.pick({
  userId: true,
  type: true,
});

export type TfaSessionType = z.infer<typeof tfaSession>;
export type TfaVerifyType = z.infer<typeof tfaVerifySchema>;
export type TfaSetupType = z.infer<typeof tfaSetupSchema>;
