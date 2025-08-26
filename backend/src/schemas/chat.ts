import { z } from 'zod/v4';
import { dtString } from './basics';

export const chatBase = z.object({
  senderId: z.number(),
  reciverId: z.number(),
  message: z.string(),
  createdAt: dtString,
});

const chatCreateBase = chatBase.pick({
  senderId: true,
  reciverId: true,
  message: true,
});
const chatCreate = chatCreateBase.meta({ $id: 'chatCreate' });

const chatQueryBase = chatBase
  .pick({
    senderId: true,
    reciverId: true,
  })
  .extend({
    senderId: z.coerce.number(),
    reciverId: z.coerce.number().optional(),
  });
const chatQuery = chatQueryBase.meta({ $id: 'chatQuery' });

const chatResponse = chatBase.meta({ $id: 'chatResponse' });
const chatResponseArray = z.array(chatBase).meta({ $id: 'chatResponseArray' });

export const chatSchemas = [chatCreate, chatQuery, chatResponse, chatResponseArray];

export type chatType = z.infer<typeof chatBase>;
export type chatCreateType = z.infer<typeof chatCreate>;
export type chatQueryType = z.infer<typeof chatQuery>;
